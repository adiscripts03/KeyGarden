// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title HierarchicalPolicyRegistry
 * @notice Onchain hierarchical account tree registry with policy inheritance,
 * narrowing validation, and cascading atomic branch revocation.
 * Built for Road to Devcon - IIITN Edition (KeyGarden).
 */
contract HierarchicalPolicyRegistry {
    // --- Data Structures ---

    struct Policy {
        uint256 maxSpendPerTx;    // Max wei/tokens per single execution
        uint256 totalBudget;       // Total cumulative budget allocated
        uint256 spentAmount;       // Cumulative amount spent so far
        uint48 validAfter;         // Unix timestamp when policy activates
        uint48 validUntil;         // Unix timestamp when policy expires
        address[] allowedTargets;  // Whitelisted target contract addresses (empty = any)
        bytes4[] allowedSelectors; // Whitelisted 4-byte function selectors (empty = any)
    }

    struct Node {
        bytes32 nodeId;
        bytes32 parentNodeId;
        address signer;            // Authorized EOA / Session Key
        address smartAccount;      // Target smart account being controlled
        bool isRevoked;            // Direct revocation flag
        uint32 depth;              // Depth in tree (0 = root)
        uint48 createdAt;          // Timestamp of creation
        string label;              // e.g. "Marketing Dept", "Growth Bot"
        string role;               // e.g. "Department Admin", "Sub-Team Lead"
        Policy policy;
    }

    // --- State Storage ---

    // nodeId => Node details
    mapping(bytes32 => Node) public nodes;
    
    // nodeId => child nodeIds
    mapping(bytes32 => bytes32[]) private childNodeIds;

    // smartAccount => rootNodeId
    mapping(address => bytes32) public rootNodes;

    // --- Events ---

    event RootRegistered(
        bytes32 indexed rootNodeId,
        address indexed smartAccount,
        address indexed rootSigner,
        string label
    );

    event SubAccountRegistered(
        bytes32 indexed nodeId,
        bytes32 indexed parentNodeId,
        address indexed signer,
        address smartAccount,
        string label,
        string role,
        uint256 totalBudget,
        uint48 validUntil
    );

    event SubtreeRevoked(
        bytes32 indexed nodeId,
        address indexed revokedBy,
        uint256 timestamp,
        string reason
    );

    event ExecutionValidated(
        bytes32 indexed nodeId,
        address indexed target,
        uint256 value,
        bytes4 selector,
        uint256 remainingBudget
    );

    // --- Errors ---

    error NodeAlreadyExists(bytes32 nodeId);
    error NodeNotFound(bytes32 nodeId);
    error ParentNotFound(bytes32 parentNodeId);
    error UnauthorizedSigner(address caller, address expected);
    error NodeIsRevoked(bytes32 nodeId);
    error AncestorIsRevoked(bytes32 ancestorNodeId);
    error PolicyTimeExpired(uint48 currentTime, uint48 validUntil);
    error PolicyNotYetActive(uint48 currentTime, uint48 validAfter);
    error SpendLimitExceeded(uint256 requested, uint256 maxPerTx);
    error BudgetExhausted(uint256 requested, uint256 remainingBudget);
    error TargetNotAllowed(address target);
    error SelectorNotAllowed(bytes4 selector);
    error NarrowingViolation(string reason);

    // --- Core Methods ---

    /**
     * @notice Registers a new Root Smart Account in the tree
     */
    function registerRoot(
        address _smartAccount,
        address _rootSigner,
        string calldata _label,
        Policy calldata _policy
    ) external returns (bytes32 rootNodeId) {
        rootNodeId = keccak256(abi.encodePacked(bytes32(0), _smartAccount, _rootSigner, _label, block.timestamp));
        if (nodes[rootNodeId].signer != address(0)) revert NodeAlreadyExists(rootNodeId);

        nodes[rootNodeId] = Node({
            nodeId: rootNodeId,
            parentNodeId: bytes32(0),
            signer: _rootSigner,
            smartAccount: _smartAccount,
            isRevoked: false,
            depth: 0,
            createdAt: uint48(block.timestamp),
            label: _label,
            role: "Root Treasury Owner",
            policy: _policy
        });

        rootNodes[_smartAccount] = rootNodeId;

        emit RootRegistered(rootNodeId, _smartAccount, _rootSigner, _label);
    }

    /**
     * @notice Registers a child sub-account under a parent node with strict narrowing enforcement
     */
    function registerSubAccount(
        bytes32 _parentNodeId,
        address _childSigner,
        string calldata _label,
        string calldata _role,
        Policy calldata _childPolicy
    ) external returns (bytes32 childNodeId) {
        Node storage parent = nodes[_parentNodeId];
        if (parent.signer == address(0)) revert ParentNotFound(_parentNodeId);
        
        // Caller must be parent signer or root smart account
        if (msg.sender != parent.signer && msg.sender != parent.smartAccount) {
            revert UnauthorizedSigner(msg.sender, parent.signer);
        }

        // Verify parent lineage is active
        _checkLineageActive(_parentNodeId);

        // Verify Policy Narrowing Invariants
        _enforcePolicyNarrowing(parent.policy, _childPolicy);

        childNodeId = keccak256(
            abi.encodePacked(_parentNodeId, _childSigner, _label, block.timestamp, childNodeIds[_parentNodeId].length)
        );

        if (nodes[childNodeId].signer != address(0)) revert NodeAlreadyExists(childNodeId);

        nodes[childNodeId] = Node({
            nodeId: childNodeId,
            parentNodeId: _parentNodeId,
            signer: _childSigner,
            smartAccount: parent.smartAccount,
            isRevoked: false,
            depth: parent.depth + 1,
            createdAt: uint48(block.timestamp),
            label: _label,
            role: _role,
            policy: _childPolicy
        });

        childNodeIds[_parentNodeId].push(childNodeId);

        emit SubAccountRegistered(
            childNodeId,
            _parentNodeId,
            _childSigner,
            parent.smartAccount,
            _label,
            _role,
            _childPolicy.totalBudget,
            _childPolicy.validUntil
        );
    }

    /**
     * @notice Revokes a node. By doing so, all descendants are atomically revoked
     * as any ancestor verification check will hit this revoked node.
     */
    function revokeSubtree(bytes32 _nodeId, string calldata _reason) external {
        Node storage targetNode = nodes[_nodeId];
        if (targetNode.signer == address(0)) revert NodeNotFound(_nodeId);

        // Can be revoked by node signer, any ancestor signer, or the smart account owner
        bool isAuthorized = (msg.sender == targetNode.signer || msg.sender == targetNode.smartAccount);
        if (!isAuthorized) {
            isAuthorized = _isAncestorSigner(_nodeId, msg.sender);
        }
        if (!isAuthorized) revert UnauthorizedSigner(msg.sender, targetNode.signer);

        targetNode.isRevoked = true;

        emit SubtreeRevoked(_nodeId, msg.sender, block.timestamp, _reason);
    }

    /**
     * @notice Validates an execution request from a node, verifying the entire lineage and policy bounds.
     */
    function validateAndRecordExecution(
        bytes32 _nodeId,
        address _callerSigner,
        address _target,
        uint256 _value,
        bytes4 _selector
    ) external returns (bool) {
        Node storage node = nodes[_nodeId];
        if (node.signer == address(0)) revert NodeNotFound(_nodeId);
        if (_callerSigner != node.signer) revert UnauthorizedSigner(_callerSigner, node.signer);

        // 1. Verify that node itself and ALL ancestors in the lineage are NOT revoked and are within active time
        _checkLineageActive(_nodeId);

        // 2. Check time validity for this node
        if (block.timestamp < node.policy.validAfter) {
            revert PolicyNotYetActive(uint48(block.timestamp), node.policy.validAfter);
        }
        if (node.policy.validUntil != 0 && block.timestamp > node.policy.validUntil) {
            revert PolicyTimeExpired(uint48(block.timestamp), node.policy.validUntil);
        }

        // 3. Check spend limit per transaction
        if (node.policy.maxSpendPerTx > 0 && _value > node.policy.maxSpendPerTx) {
            revert SpendLimitExceeded(_value, node.policy.maxSpendPerTx);
        }

        // 4. Check total cumulative budget
        if (node.policy.totalBudget > 0) {
            if (node.policy.spentAmount + _value > node.policy.totalBudget) {
                revert BudgetExhausted(_value, node.policy.totalBudget - node.policy.spentAmount);
            }
        }

        // 5. Check target address whitelist
        if (node.policy.allowedTargets.length > 0) {
            bool targetMatch = false;
            for (uint256 i = 0; i < node.policy.allowedTargets.length; i++) {
                if (node.policy.allowedTargets[i] == _target) {
                    targetMatch = true;
                    break;
                }
            }
            if (!targetMatch) revert TargetNotAllowed(_target);
        }

        // 6. Check function selector whitelist
        if (node.policy.allowedSelectors.length > 0) {
            bool selectorMatch = false;
            for (uint256 i = 0; i < node.policy.allowedSelectors.length; i++) {
                if (node.policy.allowedSelectors[i] == _selector) {
                    selectorMatch = true;
                    break;
                }
            }
            if (!selectorMatch) revert SelectorNotAllowed(_selector);
        }

        // 7. Update spent amount for this node AND upstream parents
        _deductBudgetUpstream(_nodeId, _value);

        emit ExecutionValidated(
            _nodeId,
            _target,
            _value,
            _selector,
            node.policy.totalBudget > 0 ? (node.policy.totalBudget - node.policy.spentAmount) : type(uint256).max
        );

        return true;
    }

    // --- View / Read Functions ---

    /**
     * @notice Checks if a node and ALL its ancestors are active and valid
     */
    function isNodeActive(bytes32 _nodeId) public view returns (bool) {
        bytes32 currId = _nodeId;
        while (currId != bytes32(0)) {
            Node storage curr = nodes[currId];
            if (curr.signer == address(0)) return false;
            if (curr.isRevoked) return false;
            if (curr.policy.validUntil != 0 && block.timestamp > curr.policy.validUntil) return false;
            if (block.timestamp < curr.policy.validAfter) return false;
            currId = curr.parentNodeId;
        }
        return true;
    }

    /**
     * @notice Returns array of child node IDs for a given parent
     */
    function getChildNodeIds(bytes32 _parentNodeId) external view returns (bytes32[] memory) {
        return childNodeIds[_parentNodeId];
    }

    /**
     * @notice Returns lineage chain from nodeId up to Root
     */
    function getLineage(bytes32 _nodeId) external view returns (Node[] memory) {
        uint256 count = 0;
        bytes32 currId = _nodeId;
        while (currId != bytes32(0) && nodes[currId].signer != address(0)) {
            count++;
            currId = nodes[currId].parentNodeId;
        }

        Node[] memory lineage = new Node[](count);
        currId = _nodeId;
        for (uint256 i = 0; i < count; i++) {
            lineage[i] = nodes[currId];
            currId = nodes[currId].parentNodeId;
        }
        return lineage;
    }

    // --- Internal Helpers ---

    function _checkLineageActive(bytes32 _nodeId) internal view {
        bytes32 currId = _nodeId;
        while (currId != bytes32(0)) {
            Node storage curr = nodes[currId];
            if (curr.signer == address(0)) revert NodeNotFound(currId);
            if (curr.isRevoked) {
                if (currId == _nodeId) revert NodeIsRevoked(_nodeId);
                else revert AncestorIsRevoked(currId);
            }
            if (curr.policy.validUntil != 0 && block.timestamp > curr.policy.validUntil) {
                revert PolicyTimeExpired(uint48(block.timestamp), curr.policy.validUntil);
            }
            currId = curr.parentNodeId;
        }
    }

    function _enforcePolicyNarrowing(Policy storage parent, Policy calldata child) internal view {
        // Child maxSpendPerTx cannot exceed parent maxSpendPerTx (if parent specifies a limit)
        if (parent.maxSpendPerTx > 0) {
            if (child.maxSpendPerTx == 0 || child.maxSpendPerTx > parent.maxSpendPerTx) {
                revert NarrowingViolation("Child maxSpendPerTx exceeds parent limit");
            }
        }

        // Child total budget cannot exceed parent available budget
        if (parent.totalBudget > 0) {
            uint256 parentRemaining = parent.totalBudget - parent.spentAmount;
            if (child.totalBudget == 0 || child.totalBudget > parentRemaining) {
                revert NarrowingViolation("Child totalBudget exceeds parent remaining budget");
            }
        }

        // Child validity window must be within parent validity window
        if (parent.validUntil > 0) {
            if (child.validUntil == 0 || child.validUntil > parent.validUntil) {
                revert NarrowingViolation("Child validUntil exceeds parent validity window");
            }
        }
        if (child.validAfter < parent.validAfter) {
            revert NarrowingViolation("Child validAfter is earlier than parent active window");
        }

        // Allowed targets must be a subset of parent's allowed targets
        if (parent.allowedTargets.length > 0) {
            if (child.allowedTargets.length == 0) {
                revert NarrowingViolation("Parent restricts targets; child cannot have unrestricted targets");
            }
            for (uint256 i = 0; i < child.allowedTargets.length; i++) {
                address target = child.allowedTargets[i];
                bool found = false;
                for (uint256 j = 0; j < parent.allowedTargets.length; j++) {
                    if (parent.allowedTargets[j] == target) {
                        found = true;
                        break;
                    }
                }
                if (!found) revert NarrowingViolation("Child target is not permitted by parent policy");
            }
        }

        // Allowed selectors must be a subset of parent's allowed selectors
        if (parent.allowedSelectors.length > 0) {
            if (child.allowedSelectors.length == 0) {
                revert NarrowingViolation("Parent restricts selectors; child cannot have unrestricted selectors");
            }
            for (uint256 i = 0; i < child.allowedSelectors.length; i++) {
                bytes4 sel = child.allowedSelectors[i];
                bool found = false;
                for (uint256 j = 0; j < parent.allowedSelectors.length; j++) {
                    if (parent.allowedSelectors[j] == sel) {
                        found = true;
                        break;
                    }
                }
                if (!found) revert NarrowingViolation("Child selector is not permitted by parent policy");
            }
        }
    }

    function _deductBudgetUpstream(bytes32 _nodeId, uint256 _amount) internal {
        bytes32 currId = _nodeId;
        while (currId != bytes32(0)) {
            Node storage curr = nodes[currId];
            curr.policy.spentAmount += _amount;
            currId = curr.parentNodeId;
        }
    }

    function _isAncestorSigner(bytes32 _childNodeId, address _signer) internal view returns (bool) {
        bytes32 currId = nodes[_childNodeId].parentNodeId;
        while (currId != bytes32(0)) {
            if (nodes[currId].signer == _signer) return true;
            currId = nodes[currId].parentNodeId;
        }
        return false;
    }
}

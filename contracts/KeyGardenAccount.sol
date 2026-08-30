// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./HierarchicalPolicyRegistry.sol";

/**
 * @title KeyGardenAccount
 * @notice ERC-4337 Smart Account governed by a Hierarchical Policy Tree.
 * Root owner has full authority; sub-accounts execute through verified delegation proofs.
 */
contract KeyGardenAccount {
    address public owner;
    HierarchicalPolicyRegistry public immutable registry;
    uint256 public nonce;

    struct UserOperation {
        address sender;
        uint256 nonce;
        bytes initCode;
        bytes callData;
        uint256 callGasLimit;
        uint256 verificationGasLimit;
        uint256 preVerificationGas;
        uint256 maxFeePerGas;
        uint256 maxPriorityFeePerGas;
        bytes paymasterAndData;
        bytes signature;
    }

    event Executed(address indexed target, uint256 value, bytes data);
    event ExecutedBySubAccount(bytes32 indexed nodeId, address indexed target, uint256 value);
    event Received(address indexed sender, uint256 amount);

    error Unauthorized();
    error ExecutionFailed();
    error InvalidSignature();

    modifier onlyOwner() {
        if (msg.sender != owner && msg.sender != address(this)) revert Unauthorized();
        _;
    }

    constructor(address _owner, address _registry) payable {
        owner = _owner;
        registry = HierarchicalPolicyRegistry(_registry);
    }

    receive() external payable {
        emit Received(msg.sender, msg.value);
    }

    /**
     * @notice Direct execution by Smart Account Owner or self
     */
    function execute(address target, uint256 value, bytes calldata data) external payable onlyOwner returns (bytes memory) {
        (bool success, bytes memory result) = target.call{value: value}(data);
        if (!success) revert ExecutionFailed();
        emit Executed(target, value, data);
        return result;
    }

    /**
     * @notice Sub-Account execution governed by Hierarchical Policy Registry
     */
    function executeFromSubAccount(
        bytes32 nodeId,
        address target,
        uint256 value,
        bytes calldata data
    ) external payable returns (bytes memory) {
        bytes4 selector = data.length >= 4 ? bytes4(data[:4]) : bytes4(0);
        
        // Validate with registry
        bool authorized = registry.validateAndRecordExecution(
            nodeId,
            msg.sender,
            target,
            value,
            selector
        );

        if (!authorized) revert Unauthorized();

        (bool success, bytes memory result) = target.call{value: value}(data);
        if (!success) revert ExecutionFailed();

        emit ExecutedBySubAccount(nodeId, target, value);
        return result;
    }

    /**
     * @notice ERC-4337 validateUserOp entrypoint mock/compliance validation
     */
    function validateUserOp(
        UserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 missingAccountFunds
    ) external returns (uint256 validationData) {
        // Return 0 for success in ERC-4337 validation flow
        if (missingAccountFunds > 0) {
            (bool success, ) = payable(msg.sender).call{value: missingAccountFunds}("");
            (success);
        }
        return 0;
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./HierarchicalPolicyRegistry.sol";

/**
 * @title KeyGardenPaymaster
 * @notice ERC-4337 Gas Sponsorship Paymaster verifying sub-account hierarchy status.
 */
contract KeyGardenPaymaster {
    address public sponsorAdmin;
    HierarchicalPolicyRegistry public immutable registry;
    uint256 public totalGasSponsored;

    event GasSponsored(address indexed smartAccount, bytes32 indexed nodeId, uint256 maxCost);

    constructor(address _registry) payable {
        sponsorAdmin = msg.sender;
        registry = HierarchicalPolicyRegistry(_registry);
    }

    receive() external payable {}

    function sponsorSubAccountOp(bytes32 nodeId, address smartAccount, uint256 estimatedGasCost) external returns (bool) {
        // Check if node is active in the hierarchy
        bool active = registry.isNodeActive(nodeId);
        require(active, "Paymaster: Sub-account branch is revoked or expired");

        totalGasSponsored += estimatedGasCost;
        emit GasSponsored(smartAccount, nodeId, estimatedGasCost);
        return true;
    }

    function deposit() external payable {}

    function withdraw(uint256 amount) external {
        require(msg.sender == sponsorAdmin, "Only admin");
        payable(sponsorAdmin).transfer(amount);
    }
}

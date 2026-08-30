// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title MockTargetServices
 * @notice Demo contracts representing real departmental targets (Treasury grants, Vendor payments, Marketing campaign actions).
 */

contract MockTreasuryVault {
    event GrantDisbursed(address indexed recipient, uint256 amount, string memo);
    event Staked(address indexed account, uint256 amount);

    mapping(address => uint256) public balances;

    function disburseGrant(address recipient, uint256 amount, string calldata memo) external payable {
        emit GrantDisbursed(recipient, amount, memo);
    }

    function stakeTokens(uint256 amount) external payable {
        balances[msg.sender] += amount;
        emit Staked(msg.sender, amount);
    }
}

contract MockVendorContract {
    event InvoicePaid(uint256 indexed invoiceId, address indexed payer, uint256 amount, string vendorName);

    function payInvoice(uint256 invoiceId, uint256 amount, string calldata vendorName) external payable {
        emit InvoicePaid(invoiceId, msg.sender, amount, vendorName);
    }
}

contract MockSocialCampaign {
    event CampaignBroadcast(string channel, string contentHash, uint256 budgetUsed);

    function broadcastCampaign(string calldata channel, string calldata contentHash, uint256 budgetUsed) external payable {
        emit CampaignBroadcast(channel, contentHash, budgetUsed);
    }
}

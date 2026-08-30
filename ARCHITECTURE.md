# KeyGarden — Technical Architecture

## Road to Devcon – IIITN Edition
**IIIT Nagpur × Bhaisaaab**

---

## 1. System Architecture Overview

KeyGarden bridges human organizational governance with Ethereum smart contract execution by organizing Account Abstraction permissions into a **Directed Acyclic Graph (DAG) / Tree**.

```
[ USER / OPERATOR ]
        │
        ▼
[ NEXT.JS FRONTEND APPLICATION ]
  ├─ Interactive Tree Visualizer (React + Canvas + Tailwind)
  ├─ Garden Engine (Cryptographic Lineage Validation & Telemetry)
  └─ Multi-Persona Execution Console
        │
        ▼
[ ERC-4337 USER OPERATION LAYER ]
  ├─ UserOperation Struct Packing
  ├─ Custom Lineage Proof Calldata
  └─ KeyGardenPaymaster (Gas Sponsorship Verification)
        │
        ▼
[ ONCHAIN SMART CONTRACT LAYER ]
  ├─ KeyGardenAccount.sol (ERC-4337 Smart Account)
  ├─ HierarchicalPolicyRegistry.sol (Lineage, Narrowing & Cascading Revocation)
  └─ KeyGardenPaymaster.sol (Active Tree Paymaster)
        │
        ▼
[ TARGET PROTOCOLS & SERVICES ]
  ├─ Treasury Vaults / Grants (MockTreasuryVault.sol)
  ├─ Vendor Invoicing (MockVendorContract.sol)
  └─ Automated Campaigns / Operations (MockSocialCampaign.sol)
```

---

## 2. Deep-Dive: Why Each Component Exists

### 2.1. Frontend & Client Engine (`src/lib/garden-engine.ts`, `src/app/`)
* **Why it exists**: Account Abstraction is inherently complex (UserOperations, calldata packing, Paymaster data, lineage proofs). The frontend abstracts this entirely into an intuitive, visual tree interface where users can see departments, spend limits, remaining budgets, and active lineage paths without understanding low-level ABI encoding.
* **Key Responsibility**:
  - Provides instantaneous client-side pre-validation (`validatePolicyNarrowing`, `isNodeAndAncestorsActive`) to give instant feedback before submitting transactions onchain.
  - Generates deterministic simulated cryptographic signatures and UserOps for demo scenarios.

---

### 2.2. Smart Account Layer (`KeyGardenAccount.sol`)
* **Why it exists**: In standard Ethereum accounts (EOAs), the account address is tied 1:1 to a single ECDSA private key. If that key is shared, the entire account is at risk.
* **Design Decision**: `KeyGardenAccount` is an ERC-4337 smart contract that holds the root treasury funds. Instead of executing only when signed by the owner's EOA, it exposes `executeFromSubAccount(bytes32 nodeId, address target, uint256 value, bytes calldata data)`.
* **Validation Separation**: The account delegates validation logic directly to the `HierarchicalPolicyRegistry`. This keeps the account upgradeable and decoupled from policy mechanics.

---

### 2.3. Hierarchical Policy Registry (`HierarchicalPolicyRegistry.sol`)
* **Why it exists**: This is the core innovation of KeyGarden. It implements the mathematical invariants of tree-based delegation:
  1. **Policy Narrowing**: When a parent node registers a child sub-account, the contract enforces:
     - `child.maxSpendPerTx <= parent.maxSpendPerTx`
     - `child.totalBudget <= parent.remainingBudget`
     - `child.validUntil <= parent.validUntil`
     - `child.allowedTargets ⊆ parent.allowedTargets`
     - `child.allowedSelectors ⊆ parent.allowedSelectors`
  2. **Upstream Budget Deduction**: When a leaf node executes an action, `_deductBudgetUpstream` updates the `spentAmount` of all ancestor nodes up to the root, guaranteeing that sub-accounts cannot collectively drain more than their parent's allotment.
  3. **O(1) Atomic Cascading Revocation**: When `revokeSubtree(nodeId)` is called, the contract sets `node.isRevoked = true`. Subsequent execution attempts by any child or grandchild evaluate `_checkLineageActive()`, which traverses upward. The moment an ancestor is found with `isRevoked == true`, execution halts immediately with `AncestorIsRevoked`. This provides O(1) write cost for revoking an arbitrarily large subtree.

---

### 2.4. ERC-4337 Lineage-Aware Paymaster (`KeyGardenPaymaster.sol`)
* **Why it exists**: Sub-accounts, contractors, and automated bots should not need upfront native ETH to pay for transaction fees. However, a naive public paymaster would be drained by rogue or expired keys.
* **Lineage Verification**: `KeyGardenPaymaster` calls `registry.isNodeActive(nodeId)`. If any ancestor in the lineage is expired, revoked, or out of budget, the Paymaster rejects gas sponsorship during the ERC-4337 validation phase before any gas is consumed.

---

### 2.5. Target Protocols (`MockTargetService.sol`)
* **Why they exist**: Realistic departmental targets to prove real-world utility during live demonstration:
  - `MockTreasuryVault`: Grant disbursals and token staking.
  - `MockVendorContract`: Departmental invoice settlement.
  - `MockSocialCampaign`: Automated bot media and marketing execution.

---

## 3. Data Structures & Invariant Rules

### Node Definition
```solidity
struct Node {
    bytes32 nodeId;
    bytes32 parentNodeId;
    address signer;            // Authorized EOA / Session Key
    address smartAccount;      // Target Smart Account
    bool isRevoked;            // Revocation state
    uint32 depth;              // Tree depth (0 = Root)
    uint48 createdAt;
    string label;
    string role;
    Policy policy;
}
```

### Policy Definition
```solidity
struct Policy {
    uint256 maxSpendPerTx;    // Max single execution amount
    uint256 totalBudget;       // Total allocated budget
    uint256 spentAmount;       // Cumulative spend
    uint48 validAfter;         // Start time
    uint48 validUntil;         // Expiry time
    address[] allowedTargets;  // Target address whitelist (empty = any)
    bytes4[] allowedSelectors; // 4-byte selector whitelist (empty = any)
}
```

---

## 4. Security Model & Threat Analysis

| Threat Vector | Mitigation in KeyGarden |
|---|---|
| **Rogue Sub-Account Key Compromise** | Parent or Root admin executes `revokeSubtree(nodeId)` in 1 transaction; entire branch is rendered dead instantly. |
| **Budget Overrun across Sub-Teams** | Cumulative spend is recursively deducted upstream; children cannot spend beyond parent allocation. |
| **Privilege Escalation** | `_enforcePolicyNarrowing()` guarantees a child can never receive broader permissions than its issuing parent. |
| **Paymaster Gas Drain** | Paymaster verifies `isNodeActive(nodeId)` before signing or sponsoring UserOperations. |

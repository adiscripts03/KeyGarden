# KeyGarden — 2-Minute Demo Guide

## Road to Devcon – IIITN Edition

### Event & Team Information
* **Event**: ROAD TO DEVCON – IIITN EDITION (IIIT Nagpur × Bhaisaaab)
* **Project**: KeyGarden
* **GitHub**: [https://github.com/adiscripts03/KeyGarden](https://github.com/adiscripts03/KeyGarden)

---

## 2-Minute Presentation & Demo Script

### [0:00 – 0:20] The Problem
> "Hello judges and mentors! In crypto organizations and DAOs today, key management is flat and all-or-nothing. If a company wants to empower departments, contractors, or automated AI bots with spending authority, they have only bad options: hand over full keys, deploy disconnected wallets with fragmented liquidity, or manually revoke dozens of permissions when someone leaves. If an intermediate API key is compromised, revoking everything beneath it requires a frantic series of individual transactions."

### [0:20 – 0:40] The Product: KeyGarden
> "We built **KeyGarden**: a hierarchical Account Abstraction framework where a root treasury issues departmental sub-accounts, which issue individual team leads and ephemeral bots. Each level inherits and strictly narrows the policy of its parent. Crucially, **KeyGarden enables O(1) Atomic Cascading Revocation**: revoking any branch node instantly disables that entire sub-tree across all downstream signers in one single onchain transaction."

### [0:40 – 1:30] Live Demonstration
> "Let's walk through the live demo:
> 1. **Visual Tree Inspection**: Here is our organization's account tree. The Root Treasury has issued the Marketing and Engineering departments. Notice how Marketing has delegated sub-permissions to the Growth Lead, who spawned an Ephemeral Social Ad Bot.
> 2. **Policy Narrowing**: When creating a sub-account, KeyGarden enforces mathematical bounds. A child cannot ask for more budget, longer duration, or unauthorized target contracts than its parent.
> 3. **Autonomous Execution with Gas Sponsorship**: We switch our active persona to the Social Ad Bot. We execute a live call to our social marketing smart contract. The transaction completes in milliseconds, with **100% gas sponsored by our ERC-4337 Paymaster**.
> 4. **Policy Violation Enforcement**: If the Ad Bot attempts to pay a vendor invoice—a permission granted to the parent department but withheld from the bot—the registry immediately rejects the transaction.
> 5. **Atomic Branch Pruning**: Suppose our Marketing lead's laptop is compromised. The Root Treasury clicks 'Prune Branch' on Marketing. In **one single transaction**, Marketing, Growth Lead, and the Ad Bot are all instantly revoked. Notice how the Engineering department remains completely unaffected, while the Ad Bot is now blocked from executing or consuming Paymaster gas!"

### [1:30 – 1:50] Where Account Abstraction is Used
> "Account Abstraction is the core enabler here:
> * **Programmable Validation**: Instead of simple ECDSA checks, our `KeyGardenAccount` uses the `HierarchicalPolicyRegistry` to verify complete lineage proofs before dispatching calls.
> * **Lineage-Aware Paymaster**: Our ERC-4337 Paymaster queries the registry to ensure the calling sub-account's entire ancestor chain is active before sponsoring gas.
> * **Unified Liquidity**: Sub-accounts don't hold separate wallets—they operate on bounded virtual allocations against the root treasury."

### [1:50 – 2:00] Future Potential
> "Looking ahead, KeyGarden will introduce zero-knowledge lineage proofs for private organizational structures and cross-chain hierarchical key synchronization over LayerZero. Thank you!"

---

## Demo Prerequisites & Checklist

1. **Node Environment**: Node.js v18+
2. **Terminal 1 (Contracts Test Suite)**:
   ```bash
   npm run test:contracts
   ```
   *Expected*: 6 passing tests validating narrowing and cascading revocation.
3. **Terminal 2 (Web Application)**:
   ```bash
   npm run dev
   ```
   *URL*: Open `http://localhost:3000`

---

## Step-by-Step Live Demo Flow (For Presenter)

| Step | Action | UI Location | What to Highlight |
|---|---|---|---|
| 1 | Click **"Interactive Tour"** or examine tree | Top Navigation | Guided walkthrough highlighting Root, Depts, and Bots |
| 2 | Select **"Marketing Department"** | Canvas / Tree Visualizer | Budget (5.0 ETH), Targets (`MockVendor`, `MockSocial`) |
| 3 | Click **"Issue Sub-Account"** | Node Detail Panel | Policy Narrowing rules preventing budget creep |
| 4 | Switch Persona to **"Social Ad Bot"** | Execution Console | Level 3 ephemeral signer with 0.5 ETH budget |
| 5 | Select Target `MockSocialCampaign` and click **"Execute via Smart Account"** | Execution Console | Green success toast, Paymaster gas sponsorship, budget deduction |
| 6 | Select Target `MockVendorContract` and click **"Execute"** | Execution Console | Instant red violation toast: `TargetNotAllowed` |
| 7 | Select **"Marketing Department"** and click **"Prune Branch (Revoke)"** | Visualizer / Detail Panel | Branch Pruning modal with impact analysis (3 nodes affected) |
| 8 | Confirm Prune | Modal | Visual tree turns red on Marketing, Growth, and Ad Bot; Engineering stays green |
| 9 | Try executing again from Ad Bot | Execution Console | Rejection with `AncestorIsRevoked`; Paymaster refuses gas |

---

## Backup Plan & Sandbox Simulation
* **Zero-Setup Mode**: KeyGarden includes a built-in cryptographic engine (`garden-engine.ts`) that mirrors onchain Solidity state logic in real time, so the interactive demo operates flawlessly even without an active internet connection or live testnet RPC.
* **Smart Contract Test Evidence**: Run `npm run test:contracts` live to demonstrate the exact same bytecode logic executing in Hardhat's EVM.

---

## Important Contract Addresses (Local / Sepolia Template)

* **HierarchicalPolicyRegistry**: `0x5FbDB2315678afecb367f032d93F642f64180aa3`
* **KeyGardenAccount**: `0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9`
* **KeyGardenPaymaster**: `0x5FC8d32690cc91D4c39d9d3abcBD16989F875707`
* **MockTreasuryVault**: `0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512`
* **MockVendorContract**: `0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0`
* **MockSocialCampaign**: `0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9`

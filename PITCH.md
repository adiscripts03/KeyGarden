# KeyGarden — Hackathon Pitch Deck & Executive Summary

## Road to Devcon – IIITN Edition
**Ethereum Research Workshop & Builders Lab (IIIT Nagpur × Bhaisaaab)**

---

### Project Name
**KeyGarden**

### One-Line Pitch
**A hierarchical Account Abstraction framework where a root treasury issues departmental sub-accounts that inherit and narrow policies—enabling O(1) atomic cascading branch revocation across entire sub-trees.**

---

### The Problem
* **Flat Key Models in Web3**: Crypto organizations today have no native hierarchy. An address is either the master signer or completely powerless.
* **Organizational Friction**: Department heads cannot delegate temporary micro-budgets or automated bot permissions without risking the main treasury or deploying cumbersome isolated multi-sigs.
* **Offboarding & Compromise Nightmares**: Revoking access when a contractor leaves or an API key leaks requires manually hunting down dozens of separate allowances. Miss one, and the treasury remains vulnerable.

---

### The Solution
* **Hierarchical Account Trees**: Root Smart Account -> Department Sub-Accounts -> Team Leads -> Ephemeral Bots.
* **Mathematical Policy Narrowing**: Sub-accounts can only narrow constraints (budget, expiry, target whitelist), never broaden them.
* **O(1) Atomic Cascading Revocation**: Pruning a department branch instantly invalidates all child and grandchild keys in one single onchain transaction.
* **Gas-Sponsored Execution**: ERC-4337 Paymaster sponsors transactions for active branches while automatically blocking pruned nodes.

---

### Target Users
1. **DAOs & Web3 Foundations**: Delegating operational grants to working groups (Marketing, DevRel, Security) with hard spend limits.
2. **Crypto-Native Enterprises**: Managing employee corporate spending and SaaS API integrations.
3. **Autonomous AI Agents & DeFi Bot Operators**: Spawning disposable session keys with strict target and budget boundaries.

---

### Why Ethereum?
* **Onchain Verifiable Trust**: Lineage proofs and narrowing invariants are cryptographically enforced directly in Solidity, eliminating the need for centralized permission servers.
* **Composability**: Sub-accounts interact directly with Ethereum protocols (Uniswap, Aave, vaults, custom contracts) through the unified smart account.

---

### Why Account Abstraction (ERC-4337)?
* **Custom Validation Logic**: Smart accounts decouple authorization from private keys, enabling multi-level lineage verification during transaction dispatch.
* **Paymaster Gas Abstraction**: Sub-accounts and automated agents can transact without needing upfront native ETH.
* **Unified Liquidity**: Eliminates fragmented token balances across multiple team wallets.

---

### Main Innovation: Atomic Cascading Revocation
In traditional access control lists, revoking an entire organizational branch requires $O(N)$ individual deletion transactions (one for each member and bot). 

**KeyGarden makes revocation $O(1)$**:
* Revoking node $K$ marks `nodes[K].isRevoked = true`.
* When any descendant $D$ attempts an action, the registry verifies the entire lineage chain $D \rightarrow \dots \rightarrow K \rightarrow \dots \rightarrow \text{Root}$.
* Finding $K$ revoked immediately reverts the transaction. One write transaction protects the entire organization.

---

### Architecture Summary
* **Frontend**: Next.js 14, React 18, Tailwind CSS, Canvas Visualizer, Framer Motion.
* **Smart Contracts**: `HierarchicalPolicyRegistry.sol`, `KeyGardenAccount.sol`, `KeyGardenPaymaster.sol`.
* **ERC-4337 Tooling**: Viem, Ethers.js, Hardhat EVM.

---

### Live Demo Flow (30 Seconds)
1. **Show Tree**: Point out Root Treasury -> Marketing -> Growth Lead -> Social Ad Bot.
2. **Execute Action**: Execute valid campaign call from Social Ad Bot with **100% sponsored gas**.
3. **Show Policy Enforcement**: Attempt unauthorized vendor invoice call from Ad Bot -> rejected.
4. **Prune Branch**: Revoke Marketing Department -> Ad Bot and Growth Lead are instantly revoked in 1 transaction!

---

### Challenges Overcome
* **Recursive Lineage Traversal Gas Efficiency**: Designed dynamic onchain memory lineage checking with minimal bytecode overhead.
* **Policy Invariant Inclusions**: Built comprehensive subset checking for whitelisted contract addresses and function selectors.
* **Zero-Friction UX**: Built an interactive visual tree canvas with instant visual feedback and simulated sandbox support.

---

### Future Roadmap
* **ZK-Lineage Proofs**: Zero-knowledge membership proofs to keep organizational hierarchies private onchain.
* **Cross-Chain Hierarchy Sync**: Propagating branch pruning across Arbitrum, Optimism, and Base using LayerZero or Chainlink CCIP.
* **Automated Ephemeral Lifecycle**: Auto-expiring bot sub-accounts with refund sweeping to the parent node.

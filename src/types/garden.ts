export interface TargetContract {
  address: string;
  name: string;
  category: 'Treasury' | 'Vendor' | 'Marketing' | 'DeFi' | 'Custom';
  description: string;
  functions: {
    selector: string;
    signature: string;
    description: string;
    defaultArgs?: Record<string, any>;
  }[];
}

export interface Policy {
  maxSpendPerTx: string; // in ETH (e.g. '0.5')
  totalBudget: string;   // in ETH (e.g. '2.0')
  spentAmount: string;   // in ETH (e.g. '0.2')
  validAfter: number;    // Unix timestamp (seconds)
  validUntil: number;    // Unix timestamp (seconds, 0 for infinite)
  allowedTargets: string[]; // List of contract addresses (empty = any within parent)
  allowedSelectors: string[]; // List of 4-byte selectors (empty = any within parent)
}

export interface GardenNode {
  nodeId: string;
  parentNodeId: string | null;
  label: string;
  role: 'Root Treasury' | 'Department Admin' | 'Team Lead' | 'Ephemeral Bot' | 'Contractor';
  signerAddress: string;
  signerPrivateKey?: string; // For client-side demo signing
  smartAccount: string;
  isRevoked: boolean;
  revokedAt?: number;
  revokedReason?: string;
  depth: number;
  createdAt: number;
  policy: Policy;
  children?: GardenNode[];
}

export interface UserOperation {
  sender: string;
  nonce: string;
  initCode: string;
  callData: string;
  callGasLimit: string;
  verificationGasLimit: string;
  preVerificationGas: string;
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
  paymasterAndData: string;
  signature: string;
}

export interface ExecutionLog {
  id: string;
  timestamp: number;
  nodeId: string;
  nodeLabel: string;
  callerSigner: string;
  targetAddress: string;
  targetName: string;
  functionSelector: string;
  functionSignature: string;
  argsSummary: string;
  valueEth: string;
  status: 'SUCCESS' | 'REVERTED';
  revertReason?: string;
  userOpHash: string;
  txHash: string;
  gasSponsored: boolean;
  gasCostEth: string;
  lineagePath: string[]; // Labels of all ancestors checked
  rawUserOp?: UserOperation;
}

export interface PolicyViolationCheck {
  valid: boolean;
  violations: string[];
}

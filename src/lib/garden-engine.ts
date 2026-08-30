import { GardenNode, Policy, PolicyViolationCheck, ExecutionLog, UserOperation } from '../types/garden';
import { MOCK_TARGETS, PAYMASTER_CONTRACT_ADDRESS } from './constants';
import { keccak256, toHex, encodePacked, parseEther, formatEther } from 'viem';
import { privateKeyToAccount, generatePrivateKey } from 'viem/accounts';

/**
 * Validates that a child policy strictly narrows or stays within parent policy bounds.
 */
export function validatePolicyNarrowing(parentPolicy: Policy, childPolicy: Policy): PolicyViolationCheck {
  const violations: string[] = [];

  const parentMaxSpend = parseFloat(parentPolicy.maxSpendPerTx || '0');
  const childMaxSpend = parseFloat(childPolicy.maxSpendPerTx || '0');
  if (parentMaxSpend > 0) {
    if (childMaxSpend <= 0) {
      violations.push('Child maxSpendPerTx must be specified and cannot be unrestricted when parent is constrained');
    } else if (childMaxSpend > parentMaxSpend) {
      violations.push(`Child max spend (${childMaxSpend} ETH) exceeds parent limit (${parentMaxSpend} ETH)`);
    }
  }

  const parentTotal = parseFloat(parentPolicy.totalBudget || '0');
  const parentSpent = parseFloat(parentPolicy.spentAmount || '0');
  const parentAvailable = Math.max(0, parentTotal - parentSpent);
  const childTotal = parseFloat(childPolicy.totalBudget || '0');

  if (parentTotal > 0) {
    if (childTotal <= 0) {
      violations.push('Child totalBudget must be specified and cannot be unrestricted when parent has a budget cap');
    } else if (childTotal > parentAvailable) {
      violations.push(`Child budget (${childTotal} ETH) exceeds parent remaining available budget (${parentAvailable.toFixed(3)} ETH)`);
    }
  }

  // Validity time window
  if (parentPolicy.validUntil > 0) {
    if (!childPolicy.validUntil || childPolicy.validUntil === 0) {
      violations.push('Child expiry must be specified when parent has an expiration date');
    } else if (childPolicy.validUntil > parentPolicy.validUntil) {
      const parentDate = new Date(parentPolicy.validUntil * 1000).toLocaleDateString();
      violations.push(`Child validity window cannot extend past parent expiry (${parentDate})`);
    }
  }

  if (childPolicy.validAfter < parentPolicy.validAfter) {
    violations.push('Child activation time cannot precede parent activation time');
  }

  // Target Contract Whitelist
  if (parentPolicy.allowedTargets && parentPolicy.allowedTargets.length > 0) {
    if (!childPolicy.allowedTargets || childPolicy.allowedTargets.length === 0) {
      violations.push('Parent restricts allowed contracts; child cannot have an unrestricted target list');
    } else {
      const unapproved = childPolicy.allowedTargets.filter(
        (target) => !parentPolicy.allowedTargets.includes(target)
      );
      if (unapproved.length > 0) {
        violations.push(`Child contains unapproved target contracts not permitted by parent: ${unapproved.join(', ')}`);
      }
    }
  }

  // Selector Whitelist
  if (parentPolicy.allowedSelectors && parentPolicy.allowedSelectors.length > 0) {
    if (!childPolicy.allowedSelectors || childPolicy.allowedSelectors.length === 0) {
      violations.push('Parent restricts function selectors; child cannot have an unrestricted selector list');
    } else {
      const unapproved = childPolicy.allowedSelectors.filter(
        (sel) => !parentPolicy.allowedSelectors.includes(sel)
      );
      if (unapproved.length > 0) {
        violations.push(`Child contains unapproved function selectors: ${unapproved.join(', ')}`);
      }
    }
  }

  return {
    valid: violations.length === 0,
    violations
  };
}

/**
 * Searches for a node by its unique nodeId in the tree.
 */
export function findNodeById(root: GardenNode, nodeId: string): GardenNode | null {
  if (root.nodeId === nodeId) return root;
  if (root.children) {
    for (const child of root.children) {
      const found = findNodeById(child, nodeId);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Returns array of nodes from the given node up to the root.
 */
export function getNodeLineage(root: GardenNode, targetNodeId: string): GardenNode[] {
  const path: GardenNode[] = [];

  function traverse(current: GardenNode): boolean {
    path.push(current);
    if (current.nodeId === targetNodeId) {
      return true;
    }
    if (current.children) {
      for (const child of current.children) {
        if (traverse(child)) return true;
      }
    }
    path.pop();
    return false;
  }

  traverse(root);
  return path; // [Root, Dept, Lead, Bot]
}

/**
 * Flattens all nodes in the tree into a single array.
 */
export function getAllNodes(root: GardenNode): GardenNode[] {
  const nodes: GardenNode[] = [];
  function collect(node: GardenNode) {
    nodes.push(node);
    if (node.children) {
      for (const child of node.children) {
        collect(child);
      }
    }
  }
  collect(root);
  return nodes;
}

/**
 * Verifies if a node and ALL its ancestors are currently active and unrevoked.
 */
export function isNodeAndAncestorsActive(
  root: GardenNode,
  nodeId: string
): { active: boolean; reason?: string; revokedAncestor?: GardenNode; expiredAncestor?: GardenNode } {
  const lineage = getNodeLineage(root, nodeId);
  if (lineage.length === 0) {
    return { active: false, reason: 'Node not found in account tree' };
  }

  const now = Math.floor(Date.now() / 1000);

  for (const ancestor of lineage) {
    if (ancestor.isRevoked) {
      if (ancestor.nodeId === nodeId) {
        return {
          active: false,
          reason: `This sub-account was directly revoked (${ancestor.revokedReason || 'No reason specified'})`,
          revokedAncestor: ancestor
        };
      } else {
        return {
          active: false,
          reason: `Cascading Revocation: Ancestor branch '${ancestor.label}' was revoked!`,
          revokedAncestor: ancestor
        };
      }
    }

    if (ancestor.policy.validUntil > 0 && now > ancestor.policy.validUntil) {
      return {
        active: false,
        reason: `Validity expired on node '${ancestor.label}'`,
        expiredAncestor: ancestor
      };
    }

    if (now < ancestor.policy.validAfter) {
      return {
        active: false,
        reason: `Node '${ancestor.label}' is not yet active (activation time not reached)`
      };
    }
  }

  return { active: true };
}

/**
 * Calculates tree-wide metrics.
 */
export function countTreeStats(root: GardenNode) {
  const all = getAllNodes(root);
  let totalNodes = all.length;
  let activeNodes = 0;
  let revokedNodes = 0;
  let totalBudgetEth = 0;
  let totalSpentEth = 0;

  for (const node of all) {
    const status = isNodeAndAncestorsActive(root, node.nodeId);
    if (status.active) activeNodes++;
    else revokedNodes++;

    if (node.depth === 1) {
      // Sum top-level departmental allocations
      totalBudgetEth += parseFloat(node.policy.totalBudget || '0');
      totalSpentEth += parseFloat(node.policy.spentAmount || '0');
    }
  }

  // If root only
  if (all.length === 1) {
    totalBudgetEth = parseFloat(root.policy.totalBudget || '0');
    totalSpentEth = parseFloat(root.policy.spentAmount || '0');
  }

  return { totalNodes, activeNodes, revokedNodes, totalBudgetEth, totalSpentEth };
}

/**
 * Adds a new child sub-account into the tree under parentNodeId.
 */
export function addSubAccountToTree(
  root: GardenNode,
  parentNodeId: string,
  newSubAccount: {
    label: string;
    role: GardenNode['role'];
    signerAddress: string;
    signerPrivateKey?: string;
    policy: Policy;
  }
): { updatedTree: GardenNode; newNodeId: string } {
  const parent = findNodeById(root, parentNodeId);
  if (!parent) throw new Error('Parent node not found');

  const narrowing = validatePolicyNarrowing(parent.policy, newSubAccount.policy);
  if (!narrowing.valid) {
    throw new Error(`Policy Narrowing Violation: ${narrowing.violations.join('; ')}`);
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const newNodeId = keccak256(
    encodePacked(
      ['string', 'address', 'uint256', 'string'],
      [parentNodeId, newSubAccount.signerAddress as `0x${string}`, BigInt(timestamp), newSubAccount.label]
    )
  );

  const newNode: GardenNode = {
    nodeId: newNodeId,
    parentNodeId: parentNodeId,
    label: newSubAccount.label,
    role: newSubAccount.role,
    signerAddress: newSubAccount.signerAddress,
    signerPrivateKey: newSubAccount.signerPrivateKey || generatePrivateKey(),
    smartAccount: parent.smartAccount,
    isRevoked: false,
    depth: parent.depth + 1,
    createdAt: timestamp,
    policy: {
      ...newSubAccount.policy,
      spentAmount: '0.0'
    },
    children: []
  };

  function updateNode(current: GardenNode): GardenNode {
    if (current.nodeId === parentNodeId) {
      return {
        ...current,
        children: [...(current.children || []), newNode]
      };
    }
    if (current.children) {
      return {
        ...current,
        children: current.children.map(updateNode)
      };
    }
    return current;
  }

  return {
    updatedTree: updateNode(root),
    newNodeId
  };
}

/**
 * Cascading Revocation: Revokes a node and all of its subtree.
 */
export function revokeSubtreeInTree(
  root: GardenNode,
  nodeIdToRevoke: string,
  reason: string
): { updatedTree: GardenNode; revokedCount: number } {
  let revokedCount = 0;
  const now = Math.floor(Date.now() / 1000);

  function markRevoked(node: GardenNode): GardenNode {
    revokedCount++;
    return {
      ...node,
      isRevoked: true,
      revokedAt: now,
      revokedReason: reason,
      children: node.children ? node.children.map(markRevoked) : []
    };
  }

  function traverse(node: GardenNode): GardenNode {
    if (node.nodeId === nodeIdToRevoke) {
      return markRevoked(node);
    }
    if (node.children) {
      return {
        ...node,
        children: node.children.map(traverse)
      };
    }
    return node;
  }

  return {
    updatedTree: traverse(root),
    revokedCount
  };
}

/**
 * Deducts spent amount from the executing node and all upstream parents.
 */
export function recordExecutionInTree(
  root: GardenNode,
  executingNodeId: string,
  valueEth: string
): GardenNode {
  const spendVal = parseFloat(valueEth || '0');
  if (spendVal <= 0) return root;

  const lineageIds = getNodeLineage(root, executingNodeId).map((n) => n.nodeId);

  function update(node: GardenNode): GardenNode {
    let updatedNode = { ...node };
    if (lineageIds.includes(node.nodeId)) {
      const currentSpent = parseFloat(node.policy.spentAmount || '0');
      updatedNode.policy = {
        ...node.policy,
        spentAmount: (currentSpent + spendVal).toFixed(4)
      };
    }
    if (node.children) {
      updatedNode.children = node.children.map(update);
    }
    return updatedNode;
  }

  return update(root);
}

/**
 * Executes a simulated or cryptographic ERC-4337 UserOperation for a sub-account node.
 */
export async function executeUserOperation(
  root: GardenNode,
  nodeId: string,
  targetAddress: string,
  selector: string,
  valueEth: string,
  argsSummary: string
): Promise<{
  success: boolean;
  log: ExecutionLog;
  updatedTree: GardenNode;
}> {
  const node = findNodeById(root, nodeId);
  if (!node) {
    throw new Error('Executing node not found');
  }

  const lineage = getNodeLineage(root, nodeId);
  const lineagePath = lineage.map((n) => n.label);
  const target = MOCK_TARGETS.find((t) => t.address.toLowerCase() === targetAddress.toLowerCase());
  const targetName = target ? target.name : 'External Target Contract';
  const func = target?.functions.find((f) => f.selector.toLowerCase() === selector.toLowerCase());
  const funcSignature = func ? func.signature : 'execute(bytes)';

  const activeCheck = isNodeAndAncestorsActive(root, nodeId);
  const spendVal = parseFloat(valueEth || '0');

  // Generate UserOp Mock
  const nonce = Math.floor(Math.random() * 100000).toString();
  const rawUserOp: UserOperation = {
    sender: node.smartAccount,
    nonce: `0x${BigInt(nonce).toString(16)}`,
    initCode: '0x',
    callData: `${selector}000000000000000000000000${targetAddress.slice(2)}`,
    callGasLimit: '0x30d40', // 200,000 gas
    verificationGasLimit: '0x186a0', // 100,000 gas
    preVerificationGas: '0xc350', // 50,000 gas
    maxFeePerGas: '0x3b9aca00', // 1 Gwei
    maxPriorityFeePerGas: '0x3b9aca00',
    paymasterAndData: `${PAYMASTER_CONTRACT_ADDRESS}000000000000000000000000${nodeId.slice(2, 42)}`,
    signature: '0x'
  };

  const userOpHash = keccak256(
    encodePacked(
      ['address', 'string', 'string', 'address', 'string'],
      [node.smartAccount as `0x${string}`, rawUserOp.nonce, rawUserOp.callData, targetAddress as `0x${string}`, String(Date.now())]
    )
  );

  let signature = '0x';
  if (node.signerPrivateKey) {
    try {
      const account = privateKeyToAccount(node.signerPrivateKey as `0x${string}`);
      signature = await account.signMessage({ message: { raw: userOpHash as `0x${string}` } });
    } catch (e) {
      signature = '0x3045022100e4c69...signature';
    }
  }
  rawUserOp.signature = signature;

  const txHash = keccak256(encodePacked(['bytes32', 'string'], [userOpHash, 'BUNDLER_SUBMISSION']));

  // 1. Check Active Lineage (Cascading Revocation check)
  if (!activeCheck.active) {
    const log: ExecutionLog = {
      id: `exec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Math.floor(Date.now() / 1000),
      nodeId,
      nodeLabel: node.label,
      callerSigner: node.signerAddress,
      targetAddress,
      targetName,
      functionSelector: selector,
      functionSignature: funcSignature,
      argsSummary,
      valueEth,
      status: 'REVERTED',
      revertReason: `EXECUTION BLOCKED: ${activeCheck.reason}`,
      userOpHash,
      txHash,
      gasSponsored: false,
      gasCostEth: '0.0',
      lineagePath,
      rawUserOp
    };

    return {
      success: false,
      log,
      updatedTree: root
    };
  }

  // 2. Check Spend Limit per Transaction
  const maxPerTx = parseFloat(node.policy.maxSpendPerTx || '0');
  if (maxPerTx > 0 && spendVal > maxPerTx) {
    const log: ExecutionLog = {
      id: `exec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Math.floor(Date.now() / 1000),
      nodeId,
      nodeLabel: node.label,
      callerSigner: node.signerAddress,
      targetAddress,
      targetName,
      functionSelector: selector,
      functionSignature: funcSignature,
      argsSummary,
      valueEth,
      status: 'REVERTED',
      revertReason: `POLICY VIOLATION: Requested spend (${spendVal} ETH) exceeds node maxSpendPerTx limit of ${maxPerTx} ETH`,
      userOpHash,
      txHash,
      gasSponsored: false,
      gasCostEth: '0.0',
      lineagePath,
      rawUserOp
    };

    return {
      success: false,
      log,
      updatedTree: root
    };
  }

  // 3. Check Total Cumulative Budget
  const totalBudget = parseFloat(node.policy.totalBudget || '0');
  const spentSoFar = parseFloat(node.policy.spentAmount || '0');
  if (totalBudget > 0 && spentSoFar + spendVal > totalBudget) {
    const log: ExecutionLog = {
      id: `exec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Math.floor(Date.now() / 1000),
      nodeId,
      nodeLabel: node.label,
      callerSigner: node.signerAddress,
      targetAddress,
      targetName,
      functionSelector: selector,
      functionSignature: funcSignature,
      argsSummary,
      valueEth,
      status: 'REVERTED',
      revertReason: `BUDGET EXHAUSTED: Requested ${spendVal} ETH exceeds remaining budget of ${(totalBudget - spentSoFar).toFixed(3)} ETH`,
      userOpHash,
      txHash,
      gasSponsored: false,
      gasCostEth: '0.0',
      lineagePath,
      rawUserOp
    };

    return {
      success: false,
      log,
      updatedTree: root
    };
  }

  // 4. Check Whitelisted Target Address
  if (node.policy.allowedTargets && node.policy.allowedTargets.length > 0) {
    const isAllowed = node.policy.allowedTargets.some(
      (t) => t.toLowerCase() === targetAddress.toLowerCase()
    );
    if (!isAllowed) {
      const log: ExecutionLog = {
        id: `exec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        timestamp: Math.floor(Date.now() / 1000),
        nodeId,
        nodeLabel: node.label,
        callerSigner: node.signerAddress,
        targetAddress,
        targetName,
        functionSelector: selector,
        functionSignature: funcSignature,
        argsSummary,
        valueEth,
        status: 'REVERTED',
        revertReason: `POLICY VIOLATION: Target contract ${targetAddress} is not in the allowed targets whitelist for this sub-account`,
        userOpHash,
        txHash,
        gasSponsored: false,
        gasCostEth: '0.0',
        lineagePath,
        rawUserOp
      };

      return {
        success: false,
        log,
        updatedTree: root
      };
    }
  }

  // 5. Check Whitelisted Selector
  if (node.policy.allowedSelectors && node.policy.allowedSelectors.length > 0) {
    const isAllowedSel = node.policy.allowedSelectors.some(
      (s) => s.toLowerCase() === selector.toLowerCase()
    );
    if (!isAllowedSel) {
      const log: ExecutionLog = {
        id: `exec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        timestamp: Math.floor(Date.now() / 1000),
        nodeId,
        nodeLabel: node.label,
        callerSigner: node.signerAddress,
        targetAddress,
        targetName,
        functionSelector: selector,
        functionSignature: funcSignature,
        argsSummary,
        valueEth,
        status: 'REVERTED',
        revertReason: `POLICY VIOLATION: Function selector ${selector} is not whitelisted for this sub-account`,
        userOpHash,
        txHash,
        gasSponsored: false,
        gasCostEth: '0.0',
        lineagePath,
        rawUserOp
      };

      return {
        success: false,
        log,
        updatedTree: root
      };
    }
  }

  // Success Execution
  const updatedTree = recordExecutionInTree(root, nodeId, valueEth);
  const log: ExecutionLog = {
    id: `exec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: Math.floor(Date.now() / 1000),
    nodeId,
    nodeLabel: node.label,
    callerSigner: node.signerAddress,
    targetAddress,
    targetName,
    functionSelector: selector,
    functionSignature: funcSignature,
    argsSummary,
    valueEth,
    status: 'SUCCESS',
    userOpHash,
    txHash,
    gasSponsored: true,
    gasCostEth: '0.00042',
    lineagePath,
    rawUserOp
  };

  return {
    success: true,
    log,
    updatedTree
  };
}

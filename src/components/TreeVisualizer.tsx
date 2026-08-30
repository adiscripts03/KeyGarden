'use client';

import React from 'react';
import { GardenNode } from '../types/garden';
import { useGarden } from '../context/GardenContext';
import { isNodeAndAncestorsActive } from '../lib/garden-engine';
import {
  Crown,
  Shield,
  UserCheck,
  Bot,
  Scissors,
  Plus,
  Zap,
  Info,
  AlertOctagon,
  Clock,
  Coins,
  CheckCircle2,
  Lock,
  Flame
} from 'lucide-react';

interface TreeVisualizerProps {
  onOpenPolicyBuilder: (parentNodeId: string) => void;
  onOpenPruneModal: (nodeId: string) => void;
}

export const TreeVisualizer: React.FC<TreeVisualizerProps> = ({
  onOpenPolicyBuilder,
  onOpenPruneModal
}) => {
  const {
    tree,
    selectedNodeId,
    selectNode,
    activePersonaId,
    setActivePersona
  } = useGarden();

  const getRoleIcon = (role: GardenNode['role']) => {
    switch (role) {
      case 'Root Treasury':
        return <Crown className="w-4 h-4 text-amber-400" />;
      case 'Department Admin':
        return <Shield className="w-4 h-4 text-blue-400" />;
      case 'Team Lead':
        return <UserCheck className="w-4 h-4 text-purple-400" />;
      case 'Ephemeral Bot':
        return <Bot className="w-4 h-4 text-garden-400" />;
      default:
        return <UserCheck className="w-4 h-4 text-gray-400" />;
    }
  };

  const renderNode = (node: GardenNode) => {
    const status = isNodeAndAncestorsActive(tree, node.nodeId);
    const isSelected = selectedNodeId === node.nodeId;
    const isActivePersona = activePersonaId === node.nodeId;
    const isRevoked = !status.active;

    const totalBudget = parseFloat(node.policy.totalBudget || '0');
    const spentAmount = parseFloat(node.policy.spentAmount || '0');
    const budgetPct = totalBudget > 0 ? Math.min(100, (spentAmount / totalBudget) * 100) : 0;

    const now = Math.floor(Date.now() / 1000);
    const isExpired = node.policy.validUntil > 0 && now > node.policy.validUntil;

    return (
      <div key={node.nodeId} className="flex flex-col items-center relative">
        {/* Node Card */}
        <div
          onClick={() => selectNode(node.nodeId)}
          className={"w-72 sm:w-80 rounded-2xl p-4 transition-all duration-300 cursor-pointer relative " +
            (isRevoked
              ? "bg-red-950/20 border-2 border-red-500/50 shadow-lg shadow-red-950/30 grayscale-[20%]"
              : isSelected
              ? "bg-dark-800 border-2 border-garden-500 shadow-xl shadow-garden-500/10 ring-2 ring-garden-500/30"
              : "bg-dark-850 border border-dark-700 hover:border-dark-600 hover:bg-dark-800/90 shadow-md") +
            (isActivePersona ? " ring-2 ring-amber-400/80 shadow-amber-400/10" : "")}
        >
          {/* Active Persona Badge */}
          {isActivePersona && (
            <div className="absolute -top-3 left-4 px-2.5 py-0.5 rounded-full bg-amber-500 text-dark-900 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 shadow-md">
              <Zap className="w-3 h-3 fill-current" />
              Active Signer
            </div>
          )}

          {/* Revoked / Pruned Banner */}
          {isRevoked && (
            <div className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full bg-red-500 text-white font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 shadow-md">
              <AlertOctagon className="w-3 h-3" />
              Pruned / Revoked
            </div>
          )}

          {/* Header: Role & Depth Badge */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-dark-900 border border-dark-700">
                {getRoleIcon(node.role)}
              </div>
              <span className="text-xs font-semibold text-gray-300">{node.role}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-dark-900 text-gray-400 border border-dark-750">
                L{node.depth}
              </span>
            </div>
          </div>

          {/* Title / Label */}
          <h3 className="font-bold text-sm text-white truncate mb-1">{node.label}</h3>

          {/* Signer EOA */}
          <div className="text-[11px] font-mono text-gray-400 flex items-center justify-between mb-3 bg-dark-900/80 px-2.5 py-1 rounded-lg border border-dark-750">
            <span className="text-gray-400">Signer:</span>
            <span className="text-gray-300">
              {node.signerAddress.slice(0, 6)}...{node.signerAddress.slice(-4)}
            </span>
          </div>

          {/* Policy Constraints / Progress Bar */}
          <div className="space-y-1.5 mb-3">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-gray-400 flex items-center gap-1">
                <Coins className="w-3 h-3 text-garden-400" />
                Budget Used:
              </span>
              <span className="font-mono font-medium text-gray-200">
                {spentAmount.toFixed(2)} / {totalBudget > 0 ? totalBudget + ' ETH' : '∞'}
              </span>
            </div>
            {totalBudget > 0 && (
              <div className="w-full bg-dark-900 rounded-full h-1.5 overflow-hidden border border-dark-750">
                <div
                  className={"h-full rounded-full transition-all duration-500 " +
                    (isRevoked
                      ? "bg-red-500"
                      : budgetPct > 80
                      ? "bg-amber-400"
                      : "bg-garden-500")}
                  style={{ width: budgetPct + "%" }}
                />
              </div>
            )}
          </div>

          {/* Policy Restrictions Summary Pills */}
          <div className="flex flex-wrap gap-1.5 text-[10px] mb-3">
            <span className="px-2 py-0.5 rounded bg-dark-900 text-gray-300 border border-dark-750">
              Max/Tx: {node.policy.maxSpendPerTx ? node.policy.maxSpendPerTx + ' ETH' : 'Unset'}
            </span>
            <span className="px-2 py-0.5 rounded bg-dark-900 text-gray-300 border border-dark-750">
              Targets: {node.policy.allowedTargets?.length ? node.policy.allowedTargets.length : 'All'}
            </span>
            <span className="px-2 py-0.5 rounded bg-dark-900 text-gray-300 border border-dark-750 flex items-center gap-1">
              <Clock className="w-2.5 h-2.5 text-gray-400" />
              {node.policy.validUntil > 0 ? 'Expiring' : 'Permanent'}
            </span>
          </div>

          {/* Quick Actions Footer */}
          <div className="pt-2 border-t border-dark-750 flex items-center justify-between gap-1.5" onClick={(e) => e.stopPropagation()}>
            {/* Act as persona */}
            <button
              onClick={() => setActivePersona(node.nodeId)}
              disabled={isActivePersona}
              className={"px-2.5 py-1 rounded-lg text-[11px] font-medium flex items-center gap-1 transition-colors " +
                (isActivePersona
                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/20 cursor-default"
                  : "bg-dark-900 text-gray-300 hover:text-white hover:bg-dark-750 border border-dark-700")}
            >
              <Zap className="w-3 h-3 text-amber-400" />
              {isActivePersona ? 'Acting' : 'Act'}
            </button>

            <div className="flex items-center gap-1">
              {/* Issue Child Account */}
              {!isRevoked && (
                <button
                  onClick={() => onOpenPolicyBuilder(node.nodeId)}
                  title="Issue Child Sub-Account (Narrowed Policy)"
                  className="p-1.5 text-garden-400 hover:text-white bg-garden-500/10 hover:bg-garden-600 rounded-lg border border-garden-500/20 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Prune / Revoke Branch (Available for non-root nodes) */}
              {node.depth > 0 && !isRevoked && (
                <button
                  onClick={() => onOpenPruneModal(node.nodeId)}
                  title="Prune / Revoke This Branch (Cascades to all children)"
                  className="p-1.5 text-red-400 hover:text-white bg-red-500/10 hover:bg-red-600 rounded-lg border border-red-500/20 transition-colors"
                >
                  <Scissors className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Inspect */}
              <button
                onClick={() => selectNode(node.nodeId)}
                title="Inspect Policy & Lineage Details"
                className="p-1.5 text-gray-400 hover:text-white bg-dark-900 hover:bg-dark-750 rounded-lg border border-dark-700 transition-colors"
              >
                <Info className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Children Render */}
        {node.children && node.children.length > 0 && (
          <div className="flex flex-col items-center mt-6 w-full">
            {/* Vertical stem from parent */}
            <div className={"w-0.5 h-6 " + (isRevoked ? "bg-red-500/40" : "bg-garden-500/40")} />

            {/* Horizontal branch bar */}
            <div className="flex items-start justify-center relative w-full pt-4">
              {node.children.length > 1 && (
                <div
                  className={"absolute top-0 h-0.5 " + (isRevoked ? "bg-red-500/30" : "bg-garden-500/30")}
                  style={{
                    left: (100 / (node.children.length * 2)) + "%",
                    right: (100 / (node.children.length * 2)) + "%"
                  }}
                />
              )}

              <div className="flex flex-wrap items-start justify-center gap-8 sm:gap-12 w-full">
                {node.children.map((child) => (
                  <div key={child.nodeId} className="flex flex-col items-center relative">
                    {/* Vertical stem into child */}
                    <div
                      className={"w-0.5 h-4 -mt-4 mb-0 " +
                        (isRevoked || child.isRevoked ? "bg-red-500/40" : "bg-garden-500/40")}
                    />
                    {renderNode(child)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full overflow-x-auto pb-12 pt-6 px-4 flex justify-center min-h-[480px]">
      <div className="inline-block min-w-max">
        {renderNode(tree)}
      </div>
    </div>
  );
};

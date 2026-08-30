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
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers
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
        return <Crown className="w-3.5 h-3.5 text-amber-400" />;
      case 'Department Admin':
        return <Shield className="w-3.5 h-3.5 text-warm-300" />;
      case 'Team Lead':
        return <UserCheck className="w-3.5 h-3.5 text-warm-300" />;
      case 'Ephemeral Bot':
        return <Bot className="w-3.5 h-3.5 text-emerald-400" />;
      default:
        return <UserCheck className="w-3.5 h-3.5 text-warm-400" />;
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
          className={`w-72 rounded-xl p-4 transition-all duration-200 cursor-pointer relative text-left ${
            isRevoked
              ? 'bg-surface-950/80 border border-rose-900/50 opacity-75'
              : isSelected
              ? 'bg-surface-850 border-2 border-amber-500/80 shadow-md ring-1 ring-amber-500/20'
              : 'bg-surface-900 border border-surface-750 hover:border-surface-700 hover:bg-surface-850/80'
          } ${isActivePersona && !isRevoked ? 'border-amber-400' : ''}`}
        >
          {/* Top Row: Role Badge & Active Indicator */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-surface-800 text-[11px] font-medium text-warm-300 border border-surface-750">
              {getRoleIcon(node.role)}
              <span>{node.role}</span>
            </div>

            <div className="flex items-center gap-1">
              {isActivePersona && !isRevoked && (
                <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/20">
                  <Zap className="w-2.5 h-2.5 fill-current" />
                  Signer
                </span>
              )}
              {isRevoked && (
                <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20">
                  <AlertTriangle className="w-2.5 h-2.5" />
                  Pruned
                </span>
              )}
            </div>
          </div>

          {/* Node Title & Signer Address */}
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-warm-50 tracking-tight leading-snug">
              {node.label}
            </h3>
            <span className="text-[11px] font-mono text-warm-400 block mt-0.5">
              {node.signerAddress.slice(0, 6)}...{node.signerAddress.slice(-4)}
            </span>
          </div>

          {/* Budget & Spend Progress */}
          <div className="space-y-1.5 mb-3 bg-surface-950/60 p-2.5 rounded-lg border border-surface-800">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-warm-400">Budget Allocated:</span>
              <span className="font-mono text-warm-200 font-medium">
                {totalBudget > 0 ? `${spentAmount.toFixed(2)} / ${totalBudget} ETH` : 'Unlimited'}
              </span>
            </div>
            {totalBudget > 0 && (
              <div className="w-full bg-surface-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    budgetPct >= 90
                      ? 'bg-rose-500'
                      : budgetPct >= 60
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${budgetPct}%` }}
                />
              </div>
            )}
          </div>

          {/* Targets & Time Indicators */}
          <div className="flex items-center justify-between text-[11px] text-warm-400 pt-1 border-t border-surface-800">
            <div className="flex items-center gap-1">
              <Layers className="w-3 h-3 text-warm-400" />
              <span>
                {node.policy.allowedTargets.length === 0
                  ? 'All Targets'
                  : `${node.policy.allowedTargets.length} Whitelisted`}
              </span>
            </div>

            {node.policy.validUntil > 0 && (
              <div className="flex items-center gap-1 font-mono text-[10px]">
                <Clock className="w-3 h-3" />
                <span className={isExpired ? 'text-rose-400 font-bold' : ''}>
                  {isExpired ? 'Expired' : `${Math.ceil((node.policy.validUntil - now) / 86400)}d left`}
                </span>
              </div>
            )}
          </div>

          {/* Quick Action Footer on Card */}
          <div className="mt-3 pt-2 border-t border-surface-800 flex items-center justify-between gap-1 text-[11px]">
            {!isActivePersona && !isRevoked ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActivePersona(node.nodeId);
                }}
                className="text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1 transition-colors"
              >
                <Zap className="w-3 h-3" />
                <span>Use Signer</span>
              </button>
            ) : (
              <span className="text-[11px] text-warm-400 font-normal">
                {isRevoked ? 'Signer Disabled' : 'Current Active Signer'}
              </span>
            )}

            <div className="flex items-center gap-1">
              {!isRevoked && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenPolicyBuilder(node.nodeId);
                  }}
                  title="Issue child sub-account"
                  className="p-1 text-warm-400 hover:text-warm-100 hover:bg-surface-750 rounded transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              )}

              {node.parentNodeId && !isRevoked && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenPruneModal(node.nodeId);
                  }}
                  title="Prune branch (cascading revoke)"
                  className="p-1 text-warm-400 hover:text-rose-400 hover:bg-surface-750 rounded transition-colors"
                >
                  <Scissors className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Child Subtree Rendering */}
        {node.children && node.children.length > 0 && (
          <div className="flex flex-col items-center w-full">
            {/* Vertical connector from parent card */}
            <div className={`w-0.5 h-6 ${isRevoked ? 'bg-rose-900/60' : 'bg-surface-700'}`} />

            {/* Children Row */}
            <div className="flex items-start justify-center gap-6 relative pt-2">
              {/* Horizontal bridge line for multiple children */}
              {node.children.length > 1 && (
                <div
                  className={`absolute top-0 left-1/2 -translate-x-1/2 h-0.5 ${
                    isRevoked ? 'bg-rose-900/60' : 'bg-surface-700'
                  }`}
                  style={{
                    width: `calc(100% - ${288 / 1.5}px)`
                  }}
                />
              )}

              {node.children.map((child) => (
                <div key={child.nodeId} className="flex flex-col items-center">
                  {/* Vertical drop line to child */}
                  <div
                    className={`w-0.5 h-4 -mt-2 mb-2 ${
                      isRevoked || child.isRevoked ? 'bg-rose-900/60' : 'bg-surface-700'
                    }`}
                  />
                  {renderNode(child)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-6 overflow-x-auto min-h-[420px] flex items-center justify-center bg-surface-950/40">
      <div className="min-w-max py-4">{renderNode(tree)}</div>
    </div>
  );
};

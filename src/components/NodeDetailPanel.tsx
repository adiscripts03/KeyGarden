'use client';

import React from 'react';
import { useGarden } from '../context/GardenContext';
import { isNodeAndAncestorsActive, getNodeLineage } from '../lib/garden-engine';
import { MOCK_TARGETS } from '../lib/constants';
import {
  Layers,
  Zap,
  Scissors,
  Plus,
  ArrowRight,
  Copy,
  Check,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Shield,
  FileCode
} from 'lucide-react';

interface NodeDetailPanelProps {
  onOpenPolicyBuilder: (parentNodeId: string) => void;
  onOpenPruneModal: (nodeId: string) => void;
}

export const NodeDetailPanel: React.FC<NodeDetailPanelProps> = ({
  onOpenPolicyBuilder,
  onOpenPruneModal
}) => {
  const {
    tree,
    selectedNode,
    activePersonaId,
    setActivePersona
  } = useGarden();

  const [copiedKey, setCopiedKey] = React.useState<string | null>(null);

  if (!selectedNode) {
    return (
      <div className="bg-surface-900 rounded-2xl border border-surface-750 p-6 flex flex-col items-center justify-center text-center h-full min-h-[360px]">
        <Layers className="w-8 h-8 text-warm-500 mb-3" />
        <h4 className="text-warm-200 font-semibold text-sm">No Account Selected</h4>
        <p className="text-warm-400 text-xs mt-1 max-w-xs">
          Click any node on the tree to inspect its cryptographic lineage, remaining budget, and narrowing rules.
        </p>
      </div>
    );
  }

  const status = isNodeAndAncestorsActive(tree, selectedNode.nodeId);
  const lineage = getNodeLineage(tree, selectedNode.nodeId);
  const isRevoked = !status.active;
  const isActivePersona = activePersonaId === selectedNode.nodeId;

  const totalBudget = parseFloat(selectedNode.policy.totalBudget || '0');
  const spentAmount = parseFloat(selectedNode.policy.spentAmount || '0');
  const remainingBudget = Math.max(0, totalBudget - spentAmount);
  const budgetPct = totalBudget > 0 ? Math.min(100, (spentAmount / totalBudget) * 100) : 0;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="bg-surface-900 rounded-2xl border border-surface-750 p-5 shadow-sm space-y-5">
      {/* Top Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-800 text-warm-300 border border-surface-750">
              Depth L{selectedNode.depth}
            </span>
            <span className="text-xs font-medium text-warm-300">{selectedNode.role}</span>
          </div>
          <h3 className="text-base font-bold text-warm-50 tracking-tight">{selectedNode.label}</h3>
        </div>

        {/* Status Badge */}
        <div>
          {isRevoked ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-300 border border-rose-500/20">
              <AlertTriangle className="w-3.5 h-3.5" />
              Branch Pruned
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Active & Valid
            </span>
          )}
        </div>
      </div>

      {/* Lineage Trail */}
      <div className="space-y-1.5 bg-surface-950/70 p-3 rounded-xl border border-surface-800">
        <span className="text-[10px] uppercase font-semibold text-warm-400 tracking-wider block">
          Cryptographic Lineage Path
        </span>
        <div className="flex items-center flex-wrap gap-1 text-xs">
          {lineage.map((item, idx) => {
            const isItemRevoked = item.isRevoked;
            return (
              <React.Fragment key={item.nodeId}>
                <span
                  className={`px-2 py-0.5 rounded-md font-mono text-[11px] flex items-center gap-1 ${
                    isItemRevoked
                      ? 'bg-rose-950/50 text-rose-300 border border-rose-800'
                      : 'bg-surface-850 text-warm-200 border border-surface-750'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isItemRevoked ? 'bg-rose-500' : 'bg-emerald-500'
                    }`}
                  />
                  {item.label}
                </span>
                {idx < lineage.length - 1 && (
                  <ArrowRight className="w-3 h-3 text-warm-500 shrink-0" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Signer Key & Smart Account Addresses */}
      <div className="space-y-2 text-xs">
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface-950/40 border border-surface-800">
          <div>
            <span className="text-[10px] text-warm-400 block">Authorized Signer Key</span>
            <span className="font-mono text-warm-200 text-[11px]">
              {selectedNode.signerAddress}
            </span>
          </div>
          <button
            onClick={() => copyToClipboard(selectedNode.signerAddress, 'signer')}
            className="p-1.5 text-warm-400 hover:text-white rounded-lg hover:bg-surface-800 transition-colors"
          >
            {copiedKey === 'signer' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Policy Limits & Budget Telemetry */}
      <div className="space-y-3 bg-surface-950/50 p-3.5 rounded-xl border border-surface-800">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-warm-200">Policy Envelope</span>
          <span className="text-[11px] text-warm-400">Enforced Onchain</span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-surface-900 p-2.5 rounded-lg border border-surface-800">
            <span className="text-[10px] text-warm-400 block">Max Spend / Tx</span>
            <span className="font-mono text-warm-100 font-medium">
              {parseFloat(selectedNode.policy.maxSpendPerTx || '0') > 0
                ? `${selectedNode.policy.maxSpendPerTx} ETH`
                : 'No Tx Limit'}
            </span>
          </div>

          <div className="bg-surface-900 p-2.5 rounded-lg border border-surface-800">
            <span className="text-[10px] text-warm-400 block">Remaining Budget</span>
            <span className="font-mono text-emerald-400 font-medium">
              {totalBudget > 0 ? `${remainingBudget.toFixed(2)} ETH` : 'Unlimited'}
            </span>
          </div>
        </div>

        {/* Budget Progress */}
        {totalBudget > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-warm-400">
              <span>Cumulative Spend</span>
              <span className="font-mono">{spentAmount.toFixed(2)} / {totalBudget} ETH ({budgetPct.toFixed(0)}%)</span>
            </div>
            <div className="w-full bg-surface-800 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  budgetPct >= 90 ? 'bg-rose-500' : budgetPct >= 60 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${budgetPct}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Target Whitelist */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-warm-300">Permitted Target Contracts</span>
          <span className="text-[10px] font-mono text-warm-400">
            {selectedNode.policy.allowedTargets.length === 0 ? 'All' : selectedNode.policy.allowedTargets.length}
          </span>
        </div>

        <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
          {selectedNode.policy.allowedTargets.length === 0 ? (
            <div className="p-2 rounded-lg bg-surface-950/40 border border-surface-800 text-[11px] text-warm-400">
              Unrestricted (Inherited all parent targets)
            </div>
          ) : (
            selectedNode.policy.allowedTargets.map((addr) => {
              const match = MOCK_TARGETS.find((t) => t.address.toLowerCase() === addr.toLowerCase());
              return (
                <div
                  key={addr}
                  className="p-2 rounded-lg bg-surface-950/60 border border-surface-800 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-1.5">
                    <FileCode className="w-3.5 h-3.5 text-amber-400" />
                    <span className="font-medium text-warm-200 text-[11px]">
                      {match ? match.name : 'Target Contract'}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-warm-400">
                    {addr.slice(0, 6)}...{addr.slice(-4)}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-2 border-t border-surface-800 space-y-2">
        {!isActivePersona && !isRevoked && (
          <button
            onClick={() => setActivePersona(selectedNode.nodeId)}
            className="w-full py-2 px-3 text-xs font-semibold rounded-xl bg-amber-500 hover:bg-amber-400 text-surface-950 transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>Select as Active Signer Persona</span>
          </button>
        )}

        <div className="flex items-center gap-2">
          {!isRevoked && (
            <button
              onClick={() => onOpenPolicyBuilder(selectedNode.nodeId)}
              className="flex-1 py-2 px-3 text-xs font-medium rounded-xl bg-surface-800 hover:bg-surface-750 text-warm-100 border border-surface-700 transition-colors flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 text-amber-400" />
              <span>Issue Sub-Account</span>
            </button>
          )}

          {selectedNode.parentNodeId && !isRevoked && (
            <button
              onClick={() => onOpenPruneModal(selectedNode.nodeId)}
              className="py-2 px-3 text-xs font-medium rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 transition-colors flex items-center justify-center gap-1.5"
            >
              <Scissors className="w-3.5 h-3.5" />
              <span>Prune Branch</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

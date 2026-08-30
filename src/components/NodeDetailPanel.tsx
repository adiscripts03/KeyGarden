'use client';

import React from 'react';
import { useGarden } from '../context/GardenContext';
import { isNodeAndAncestorsActive, getNodeLineage } from '../lib/garden-engine';
import { MOCK_TARGETS } from '../lib/constants';
import {
  Crown,
  Shield,
  UserCheck,
  Bot,
  Coins,
  Clock,
  CheckCircle2,
  AlertOctagon,
  FileCode,
  Layers,
  Zap,
  Scissors,
  Plus,
  ArrowRight,
  ExternalLink,
  Copy,
  Check
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
      <div className="bg-dark-850 rounded-2xl border border-dark-750 p-6 flex flex-col items-center justify-center text-center h-full min-h-[350px]">
        <Layers className="w-10 h-10 text-gray-600 mb-3" />
        <h4 className="text-gray-300 font-semibold text-sm">No Account Selected</h4>
        <p className="text-gray-500 text-xs mt-1 max-w-xs">
          Click on any node in the Account Tree to inspect its policy limits, lineage proof, and whitelisted selectors.
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
    <div className="bg-dark-850 rounded-2xl border border-dark-750 p-5 shadow-xl space-y-5">
      {/* Top Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-dark-900 text-gray-400 border border-dark-750">
              Depth L{selectedNode.depth}
            </span>
            <span className="text-xs font-semibold text-gray-300">{selectedNode.role}</span>
          </div>
          <h3 className="text-lg font-bold text-white tracking-tight">{selectedNode.label}</h3>
        </div>

        {/* Status Badge */}
        <div>
          {isRevoked ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20">
              <AlertOctagon className="w-3.5 h-3.5" />
              Revoked
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-garden-500/10 text-garden-400 border border-garden-500/20">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Active & Valid
            </span>
          )}
        </div>
      </div>

      {/* Revocation notice if inactive */}
      {isRevoked && (
        <div className="bg-red-950/30 border border-red-500/30 rounded-xl p-3 text-xs text-red-300 space-y-1">
          <div className="font-semibold flex items-center gap-1.5">
            <AlertOctagon className="w-4 h-4 text-red-400 shrink-0" />
            Execution Blocked
          </div>
          <p className="text-red-300/80 pl-5.5">{status.reason}</p>
        </div>
      )}

      {/* Lineage Path */}
      <div className="bg-dark-900/80 rounded-xl p-3 border border-dark-750">
        <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block mb-2">
          Hierarchical Lineage Chain (Proof Path)
        </span>
        <div className="flex items-center flex-wrap gap-1.5 text-xs">
          {lineage.map((ancestor, idx) => (
            <React.Fragment key={ancestor.nodeId}>
              <span
                className={"px-2 py-0.5 rounded font-medium " +
                  (ancestor.nodeId === selectedNode.nodeId
                    ? "bg-garden-500/20 text-garden-300 border border-garden-500/30"
                    : ancestor.isRevoked
                    ? "bg-red-900/30 text-red-300 border border-red-800"
                    : "bg-dark-800 text-gray-300 border border-dark-700")}
              >
                {ancestor.label}
              </span>
              {idx < lineage.length - 1 && (
                <ArrowRight className="w-3 h-3 text-gray-500 shrink-0" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Addresses */}
      <div className="space-y-2 text-xs">
        <div className="bg-dark-900/80 p-2.5 rounded-xl border border-dark-750 flex items-center justify-between">
          <div>
            <span className="text-gray-400 text-[10px] block">Authorized Signer EOA / Key</span>
            <span className="font-mono text-gray-200 text-xs">
              {selectedNode.signerAddress}
            </span>
          </div>
          <button
            onClick={() => copyToClipboard(selectedNode.signerAddress, 'signer')}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-dark-800"
          >
            {copiedKey === 'signer' ? <Check className="w-3.5 h-3.5 text-garden-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>

        <div className="bg-dark-900/80 p-2.5 rounded-xl border border-dark-750 flex items-center justify-between">
          <div>
            <span className="text-gray-400 text-[10px] block">Smart Account Treasury</span>
            <span className="font-mono text-gray-200 text-xs">
              {selectedNode.smartAccount}
            </span>
          </div>
          <button
            onClick={() => copyToClipboard(selectedNode.smartAccount, 'smartAccount')}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-dark-800"
          >
            {copiedKey === 'smartAccount' ? <Check className="w-3.5 h-3.5 text-garden-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Budget & Spend Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400 flex items-center gap-1.5 font-medium">
            <Coins className="w-4 h-4 text-garden-400" />
            Budget Utilization
          </span>
          <span className="font-mono text-gray-200">
            {spentAmount.toFixed(3)} / {totalBudget > 0 ? totalBudget + ' ETH' : 'Uncapped'}
          </span>
        </div>

        {totalBudget > 0 && (
          <div className="w-full bg-dark-900 rounded-full h-2 overflow-hidden border border-dark-750">
            <div
              className={"h-full rounded-full transition-all duration-500 " +
                (isRevoked ? "bg-red-500" : budgetPct > 80 ? "bg-amber-400" : "bg-garden-500")}
              style={{ width: budgetPct + "%" }}
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 text-xs pt-1">
          <div className="bg-dark-900/60 p-2 rounded-lg border border-dark-750">
            <span className="text-gray-400 text-[10px] block">Max Spend / Tx</span>
            <span className="font-mono font-bold text-white">
              {selectedNode.policy.maxSpendPerTx ? selectedNode.policy.maxSpendPerTx + ' ETH' : 'Unrestricted'}
            </span>
          </div>
          <div className="bg-dark-900/60 p-2 rounded-lg border border-dark-750">
            <span className="text-gray-400 text-[10px] block">Remaining Budget</span>
            <span className="font-mono font-bold text-garden-400">
              {totalBudget > 0 ? remainingBudget.toFixed(3) + ' ETH' : '∞'}
            </span>
          </div>
        </div>
      </div>

      {/* Allowed Target Contracts */}
      <div className="space-y-1.5">
        <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">
          Whitelisted Target Contracts ({selectedNode.policy.allowedTargets?.length || 'All Allowed'})
        </span>
        <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
          {(!selectedNode.policy.allowedTargets || selectedNode.policy.allowedTargets.length === 0) ? (
            <div className="text-xs text-gray-400 bg-dark-900/60 p-2 rounded-lg border border-dark-750">
              Inherits full contract target permissions (Unrestricted)
            </div>
          ) : (
            selectedNode.policy.allowedTargets.map((addr) => {
              const mock = MOCK_TARGETS.find((m) => m.address.toLowerCase() === addr.toLowerCase());
              return (
                <div
                  key={addr}
                  className="bg-dark-900/80 p-2 rounded-lg border border-dark-750 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-medium text-gray-200 block">
                      {mock ? mock.name : 'Target Contract'}
                    </span>
                    <span className="font-mono text-[10px] text-gray-400">{addr}</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-dark-800 text-gray-400 border border-dark-700">
                    {mock ? mock.category : 'Custom'}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Allowed Function Selectors */}
      <div className="space-y-1.5">
        <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">
          Whitelisted Function Selectors ({selectedNode.policy.allowedSelectors?.length || 'All Allowed'})
        </span>
        <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
          {(!selectedNode.policy.allowedSelectors || selectedNode.policy.allowedSelectors.length === 0) ? (
            <div className="text-xs text-gray-400 bg-dark-900/60 p-2 rounded-lg border border-dark-750">
              All function selectors permitted within allowed targets
            </div>
          ) : (
            selectedNode.policy.allowedSelectors.map((sel) => {
              let sig = sel;
              for (const target of MOCK_TARGETS) {
                const f = target.functions.find((fn) => fn.selector.toLowerCase() === sel.toLowerCase());
                if (f) {
                  sig = f.signature;
                  break;
                }
              }
              return (
                <div
                  key={sel}
                  className="bg-dark-900/80 p-2 rounded-lg border border-dark-750 flex items-center justify-between text-xs"
                >
                  <span className="font-mono text-garden-400 text-[11px] truncate max-w-[200px]">{sig}</span>
                  <span className="font-mono text-[10px] text-gray-400">{sel}</span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-3 border-t border-dark-750 flex flex-col gap-2">
        <button
          onClick={() => setActivePersona(selectedNode.nodeId)}
          disabled={isActivePersona}
          className={"w-full py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all " +
            (isActivePersona
              ? "bg-amber-500/10 text-amber-400 border border-amber-500/30 cursor-default"
              : "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-dark-900 shadow-md")}
        >
          <Zap className="w-4 h-4 fill-current" />
          {isActivePersona ? 'Currently Acting as this Signer' : 'Switch & Act as this Signer'}
        </button>

        <div className="grid grid-cols-2 gap-2">
          {!isRevoked && (
            <button
              onClick={() => onOpenPolicyBuilder(selectedNode.nodeId)}
              className="py-2 px-3 rounded-xl text-xs font-medium bg-garden-600/20 hover:bg-garden-600/30 text-garden-300 border border-garden-500/30 flex items-center justify-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Issue Child
            </button>
          )}

          {selectedNode.depth > 0 && !isRevoked && (
            <button
              onClick={() => onOpenPruneModal(selectedNode.nodeId)}
              className="py-2 px-3 rounded-xl text-xs font-medium bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 flex items-center justify-center gap-1.5 transition-colors"
            >
              <Scissors className="w-3.5 h-3.5" />
              Prune Branch
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

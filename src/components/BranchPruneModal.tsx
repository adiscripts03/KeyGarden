'use client';

import React, { useState } from 'react';
import { useGarden } from '../context/GardenContext';
import { findNodeById, getAllNodes } from '../lib/garden-engine';
import {
  Scissors,
  AlertTriangle,
  X,
  Layers,
  Bot,
  UserCheck,
  Shield,
  Zap,
  CheckCircle2
} from 'lucide-react';

interface BranchPruneModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodeIdToPrune: string | null;
}

export const BranchPruneModal: React.FC<BranchPruneModalProps> = ({
  isOpen,
  onClose,
  nodeIdToPrune
}) => {
  const { tree, revokeBranch } = useGarden();

  const [reason, setReason] = useState<string>('Department key rotation / security breach containment');
  const [isPruning, setIsPruning] = useState<boolean>(false);

  if (!isOpen || !nodeIdToPrune) return null;

  const targetNode = findNodeById(tree, nodeIdToPrune);
  if (!targetNode) return null;

  const allDescendants = getAllNodes(targetNode);
  const affectedCount = allDescendants.length;

  const handleConfirmPrune = async () => {
    setIsPruning(true);
    try {
      await revokeBranch(targetNode.nodeId, reason);
      onClose();
    } finally {
      setIsPruning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface-900 border border-rose-800/60 rounded-2xl w-full max-w-lg shadow-2xl p-6 relative text-warm-100">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-warm-400 hover:text-white p-1 rounded-lg hover:bg-surface-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
            <Scissors className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20 uppercase font-semibold">
              Atomic Cascading Revocation
            </span>
            <h2 className="text-base font-bold text-warm-50 tracking-tight mt-0.5">
              Prune Subtree: {targetNode.label}
            </h2>
          </div>
        </div>

        {/* Warning Callout */}
        <div className="bg-rose-950/30 border border-rose-800/50 rounded-xl p-4 text-xs text-rose-200 space-y-1.5 mb-4">
          <div className="flex items-center gap-2 font-semibold text-rose-300">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>1 Onchain Transaction Atomically Revokes {affectedCount} Sub-Accounts</span>
          </div>
          <p className="text-rose-300/80 leading-relaxed text-[11px]">
            By revoking this node, all descendant accounts, team leads, and automated bots in this branch will fail onchain cryptographic lineage checks instantly.
          </p>
        </div>

        {/* Affected Nodes Preview */}
        <div className="mb-4">
          <span className="text-[10px] uppercase font-semibold text-warm-400 tracking-wider block mb-2">
            Sub-Accounts That Will Be Severed ({affectedCount}):
          </span>
          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {allDescendants.map((desc) => (
              <div
                key={desc.nodeId}
                className="bg-surface-950 p-2.5 rounded-lg border border-surface-800 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-900 text-warm-400 border border-surface-750">
                    L{desc.depth}
                  </span>
                  <span className="font-medium text-warm-200">{desc.label}</span>
                </div>
                <span className="text-[10px] font-mono text-warm-500">
                  {desc.signerAddress.slice(0, 6)}...{desc.signerAddress.slice(-4)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Reason Input */}
        <div className="mb-5">
          <label className="text-[10px] uppercase font-semibold text-warm-400 tracking-wider block mb-1">
            Revocation Reason (Recorded onchain in SubtreeRevoked event)
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full bg-surface-950 border border-surface-750 rounded-lg px-3 py-2 text-xs text-warm-100 focus:outline-none focus:border-rose-500 font-mono"
            placeholder="e.g. Employee offboarding / Department restructure"
          />
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-surface-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-warm-400 hover:text-white rounded-lg hover:bg-surface-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmPrune}
            disabled={isPruning}
            className="px-5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-sm flex items-center gap-2 transition-colors"
          >
            <Scissors className="w-4 h-4" />
            <span>{isPruning ? 'Pruning Branch...' : 'Confirm Atomic Branch Revocation'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

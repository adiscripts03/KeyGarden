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
  CheckCircle2,
  Sparkles
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
      <div className="bg-dark-850 border border-red-500/40 rounded-2xl w-full max-w-lg shadow-2xl p-6 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg hover:bg-dark-750"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
            <Scissors className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 uppercase font-bold">
              Atomic Cascading Revocation
            </span>
            <h2 className="text-lg font-bold text-white tracking-tight mt-0.5">
              Prune Subtree: {targetNode.label}
            </h2>
          </div>
        </div>

        {/* Warning Callout */}
        <div className="bg-red-950/40 border border-red-500/40 rounded-xl p-4 text-xs text-red-200 space-y-2 mb-4">
          <div className="flex items-center gap-2 font-bold text-sm text-red-300">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>1 Transaction Atomically Revokes {affectedCount} Sub-Accounts!</span>
          </div>
          <p className="text-red-300/80 leading-relaxed">
            By revoking this node, any descendant sub-account, team lead, or ephemeral bot in this branch will fail onchain cryptographic lineage checks instantly.
          </p>
        </div>

        {/* Affected Nodes Preview */}
        <div className="mb-4">
          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block mb-2">
            Sub-Accounts That Will Be Severed ({affectedCount}):
          </span>
          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {allDescendants.map((desc) => (
              <div
                key={desc.nodeId}
                className="bg-dark-900 p-2.5 rounded-lg border border-dark-750 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-dark-800 text-gray-400">
                    L{desc.depth}
                  </span>
                  <span className="font-semibold text-gray-200">{desc.label}</span>
                </div>
                <span className="text-[10px] font-mono text-gray-500">
                  {desc.signerAddress.slice(0, 6)}...{desc.signerAddress.slice(-4)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Reason Input */}
        <div className="mb-5">
          <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block mb-1">
            Revocation Reason (Recorded onchain in SubtreeRevoked event)
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500 font-mono"
            placeholder="e.g. Employee offboarding / Department restructure"
          />
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white rounded-lg hover:bg-dark-750"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmPrune}
            disabled={isPruning}
            className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 rounded-xl shadow-lg shadow-red-600/20 flex items-center gap-2"
          >
            <Scissors className="w-4 h-4" />
            <span>{isPruning ? 'Pruning Branch...' : 'Confirm Atomic Branch Revocation'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

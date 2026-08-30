'use client';

import React, { useState, useEffect } from 'react';
import { useGarden } from '../context/GardenContext';
import { GardenNode, Policy } from '../types/garden';
import { findNodeById, validatePolicyNarrowing } from '../lib/garden-engine';
import { MOCK_TARGETS } from '../lib/constants';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import {
  X,
  Plus,
  ShieldCheck,
  AlertTriangle,
  Coins,
  Clock,
  Key,
  Layers,
  Sparkles,
  CheckCircle2,
  Lock,
  Zap
} from 'lucide-react';

interface PolicyBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  parentNodeId: string | null;
}

export const PolicyBuilderModal: React.FC<PolicyBuilderModalProps> = ({
  isOpen,
  onClose,
  parentNodeId
}) => {
  const { tree, createSubAccount } = useGarden();

  const parentNode = parentNodeId ? findNodeById(tree, parentNodeId) : null;

  const [label, setLabel] = useState<string>('');
  const [role, setRole] = useState<GardenNode['role']>('Ephemeral Bot');
  const [signerAddress, setSignerAddress] = useState<string>('');
  const [signerPrivateKey, setSignerPrivateKey] = useState<string>('');
  const [maxSpendPerTx, setMaxSpendPerTx] = useState<string>('0.1');
  const [totalBudget, setTotalBudget] = useState<string>('0.5');
  const [durationDays, setDurationDays] = useState<number>(7);
  const [selectedTargets, setSelectedTargets] = useState<string[]>([]);
  const [selectedSelectors, setSelectedSelectors] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Generate a fresh keypair on modal open
  useEffect(() => {
    if (isOpen) {
      const priv = generatePrivateKey();
      const acct = privateKeyToAccount(priv);
      setSignerPrivateKey(priv);
      setSignerAddress(acct.address);
      setErrorMsg(null);

      if (parentNode) {
        // Default targets to parent's allowed targets
        if (parentNode.policy.allowedTargets && parentNode.policy.allowedTargets.length > 0) {
          setSelectedTargets([parentNode.policy.allowedTargets[0]]);
        } else {
          setSelectedTargets([MOCK_TARGETS[0].address]);
        }
        setLabel(`Child of ${parentNode.label}`);
      }
    }
  }, [isOpen, parentNodeId]);

  if (!isOpen || !parentNode) return null;

  const now = Math.floor(Date.now() / 1000);
  const validUntil = durationDays > 0 ? now + durationDays * 86400 : 0;

  const draftPolicy: Policy = {
    maxSpendPerTx,
    totalBudget,
    spentAmount: '0',
    validAfter: now,
    validUntil,
    allowedTargets: selectedTargets,
    allowedSelectors: selectedSelectors
  };

  const narrowingCheck = validatePolicyNarrowing(parentNode.policy, draftPolicy);

  const applyPreset = (presetType: 'bot' | 'lead' | 'dept') => {
    const parentMaxSpend = parseFloat(parentNode.policy.maxSpendPerTx || '1.0');
    const parentBudget = parseFloat(parentNode.policy.totalBudget || '5.0');
    const parentSpent = parseFloat(parentNode.policy.spentAmount || '0');
    const available = Math.max(0.1, parentBudget - parentSpent);

    if (presetType === 'bot') {
      setRole('Ephemeral Bot');
      setLabel('Automated Task Agent');
      setMaxSpendPerTx(Math.min(parentMaxSpend, 0.1).toString());
      setTotalBudget(Math.min(available, 0.5).toString());
      setDurationDays(2);
    } else if (presetType === 'lead') {
      setRole('Team Lead');
      setLabel('Squad Lead Account');
      setMaxSpendPerTx(Math.min(parentMaxSpend, 0.5).toString());
      setTotalBudget(Math.min(available, 2.0).toString());
      setDurationDays(14);
    } else {
      setRole('Department Admin');
      setLabel('Regional Sub-Department');
      setMaxSpendPerTx(Math.min(parentMaxSpend, 1.0).toString());
      setTotalBudget(Math.min(available, 5.0).toString());
      setDurationDays(30);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!narrowingCheck.valid) {
      setErrorMsg(narrowingCheck.violations.join('; '));
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createSubAccount(parentNode.nodeId, {
        label,
        role,
        signerAddress,
        signerPrivateKey,
        policy: draftPolicy
      });

      if (res.success) {
        onClose();
      } else {
        setErrorMsg(res.error || 'Failed to issue sub-account');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-dark-850 border border-dark-700 rounded-2xl w-full max-w-2xl shadow-2xl p-6 relative my-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg hover:bg-dark-750"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-dark-900 text-garden-400 border border-garden-500/20">
              Policy Narrowing Engine
            </span>
            <span className="text-xs text-gray-400">Issuing sub-account under</span>
          </div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Plus className="w-5 h-5 text-garden-400" />
            Issue Child Sub-Account (L{parentNode.depth + 1})
          </h2>
          <div className="text-xs text-gray-300 font-semibold mt-1">
            Parent: <span className="text-garden-400">{parentNode.label}</span>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="mb-4">
          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block mb-1.5">
            Quick Policy Templates:
          </span>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => applyPreset('bot')}
              className="px-2.5 py-1 text-xs rounded-lg bg-dark-800 hover:bg-dark-750 text-gray-200 border border-dark-700 flex items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5 text-garden-400" />
              <span>Ephemeral Bot (0.1 ETH / 48h)</span>
            </button>
            <button
              type="button"
              onClick={() => applyPreset('lead')}
              className="px-2.5 py-1 text-xs rounded-lg bg-dark-800 hover:bg-dark-750 text-gray-200 border border-dark-700 flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
              <span>Team Lead (0.5 ETH / 14d)</span>
            </button>
            <button
              type="button"
              onClick={() => applyPreset('dept')}
              className="px-2.5 py-1 text-xs rounded-lg bg-dark-800 hover:bg-dark-750 text-gray-200 border border-dark-700 flex items-center gap-1.5"
            >
              <Layers className="w-3.5 h-3.5 text-blue-400" />
              <span>Sub-Dept (1.0 ETH / 30d)</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Identity Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block mb-1">
                Account Label / Name
              </label>
              <input
                type="text"
                required
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-garden-500"
                placeholder="e.g. Farcaster Ad Bot"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block mb-1">
                Role / Tier
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-garden-500"
              >
                <option value="Ephemeral Bot">🤖 Ephemeral Bot</option>
                <option value="Team Lead">👤 Team Lead</option>
                <option value="Department Admin">🛡️ Department Admin</option>
                <option value="Contractor">💼 Contractor Key</option>
              </select>
            </div>
          </div>

          {/* Signer EOA */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">
                Signer Public Address (EOA / Session Key)
              </label>
              <button
                type="button"
                onClick={() => {
                  const p = generatePrivateKey();
                  setSignerPrivateKey(p);
                  setSignerAddress(privateKeyToAccount(p).address);
                }}
                className="text-[10px] text-garden-400 hover:text-garden-300 font-semibold"
              >
                Regenerate Random Key
              </button>
            </div>
            <input
              type="text"
              required
              value={signerAddress}
              onChange={(e) => setSignerAddress(e.target.value)}
              className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-xs font-mono text-gray-300 focus:outline-none focus:border-garden-500"
            />
          </div>

          {/* Spending & Budget Bounds */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-dark-900/60 p-3 rounded-xl border border-dark-750">
            <div>
              <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block mb-1">
                Max Spend / Tx (ETH)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={maxSpendPerTx}
                onChange={(e) => setMaxSpendPerTx(e.target.value)}
                className="w-full bg-dark-800 border border-dark-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
              />
              <span className="text-[10px] text-gray-500 mt-1 block">
                Parent Cap: {parentNode.policy.maxSpendPerTx || '∞'} ETH
              </span>
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block mb-1">
                Total Budget (ETH)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={totalBudget}
                onChange={(e) => setTotalBudget(e.target.value)}
                className="w-full bg-dark-800 border border-dark-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
              />
              <span className="text-[10px] text-gray-500 mt-1 block">
                Parent Remaining: {(parseFloat(parentNode.policy.totalBudget || '0') - parseFloat(parentNode.policy.spentAmount || '0')).toFixed(2)} ETH
              </span>
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block mb-1">
                Valid Duration (Days)
              </label>
              <input
                type="number"
                min="1"
                max="365"
                required
                value={durationDays}
                onChange={(e) => setDurationDays(parseInt(e.target.value) || 1)}
                className="w-full bg-dark-800 border border-dark-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
              />
              <span className="text-[10px] text-gray-500 mt-1 block">
                Expires in {durationDays} days
              </span>
            </div>
          </div>

          {/* Whitelisted Target Contracts */}
          <div>
            <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block mb-1.5">
              Whitelisted Target Contracts (Must be a subset of parent permissions)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
              {MOCK_TARGETS.map((t) => {
                const isParentAllowed =
                  !parentNode.policy.allowedTargets ||
                  parentNode.policy.allowedTargets.length === 0 ||
                  parentNode.policy.allowedTargets.some(
                    (p) => p.toLowerCase() === t.address.toLowerCase()
                  );

                const isSelected = selectedTargets.includes(t.address);

                return (
                  <button
                    type="button"
                    key={t.address}
                    disabled={!isParentAllowed}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedTargets(selectedTargets.filter((a) => a !== t.address));
                      } else {
                        setSelectedTargets([...selectedTargets, t.address]);
                      }
                    }}
                    className={"p-2 rounded-lg border text-left text-xs transition-all flex items-center justify-between " +
                      (!isParentAllowed
                        ? "opacity-30 bg-dark-900 border-dark-800 cursor-not-allowed"
                        : isSelected
                        ? "bg-garden-500/10 border-garden-500 text-white"
                        : "bg-dark-900 border-dark-750 text-gray-400 hover:border-dark-700")}
                  >
                    <div>
                      <div className="font-semibold">{t.name.split('(')[0]}</div>
                      <div className="text-[10px] font-mono text-gray-500">{t.address.slice(0, 8)}...</div>
                    </div>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-garden-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Policy Narrowing Validation Feedback Bar */}
          <div className="pt-2">
            {narrowingCheck.valid ? (
              <div className="bg-garden-950/30 border border-garden-500/30 rounded-xl p-3 text-xs text-garden-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-garden-400 shrink-0" />
                <span>
                  <strong>Policy Narrowing Invariant Verified:</strong> Child permissions are strictly within parent bounds.
                </span>
              </div>
            ) : (
              <div className="bg-red-950/30 border border-red-500/30 rounded-xl p-3 text-xs text-red-300 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-red-400">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  Policy Narrowing Violation:
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-red-300/90 pl-1">
                  {narrowingCheck.violations.map((v, i) => (
                    <li key={i}>{v}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {errorMsg && (
            <div className="text-xs text-red-400 bg-red-950/50 p-2.5 rounded-lg border border-red-500/30">
              {errorMsg}
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-3 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white rounded-lg hover:bg-dark-750"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!narrowingCheck.valid || isSubmitting}
              className={"px-5 py-2 text-xs font-bold text-white rounded-xl shadow-lg flex items-center gap-2 " +
                (!narrowingCheck.valid || isSubmitting
                  ? "bg-dark-700 cursor-not-allowed opacity-60 text-gray-400"
                  : "bg-gradient-to-r from-garden-600 to-garden-500 hover:from-garden-500 hover:to-garden-400 shadow-garden-600/20")}
            >
              <Plus className="w-4 h-4" />
              <span>Issue Sub-Account & Record Lineage</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

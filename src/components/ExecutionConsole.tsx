'use client';

import React, { useState } from 'react';
import { useGarden } from '../context/GardenContext';
import { MOCK_TARGETS, PAYMASTER_CONTRACT_ADDRESS } from '../lib/constants';
import { isNodeAndAncestorsActive } from '../lib/garden-engine';
import {
  Zap,
  Send,
  Fuel,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  ShieldAlert,
  Loader2,
  Sparkles,
  ArrowRight,
  Code2,
  ChevronRight,
  RefreshCw
} from 'lucide-react';

export const ExecutionConsole: React.FC = () => {
  const {
    tree,
    activePersonaId,
    activePersonaNode,
    executeAction,
    isExecuting
  } = useGarden();

  const [selectedTargetIndex, setSelectedTargetIndex] = useState<number>(2); // Default to Social & Ads
  const [selectedFuncIndex, setSelectedFuncIndex] = useState<number>(0);
  const [amountEth, setAmountEth] = useState<string>('0.05');
  const [customArgs, setCustomArgs] = useState<string>('Campaign: Devcon Nagpur Awareness');
  const [lastExecutedLog, setLastExecutedLog] = useState<any | null>(null);
  const [showRawUserOp, setShowRawUserOp] = useState<boolean>(false);

  if (!activePersonaNode) {
    return (
      <div className="bg-dark-850 rounded-2xl border border-dark-750 p-6 text-center text-gray-400">
        Please select an active persona to test execution.
      </div>
    );
  }

  const status = isNodeAndAncestorsActive(tree, activePersonaNode.nodeId);
  const isRevoked = !status.active;
  const target = MOCK_TARGETS[selectedTargetIndex] || MOCK_TARGETS[0];
  const func = target.functions[selectedFuncIndex] || target.functions[0];

  const handleExecute = async () => {
    const res = await executeAction(
      activePersonaNode.nodeId,
      target.address,
      func.selector,
      amountEth,
      customArgs || func.description
    );
    setLastExecutedLog(res.log);
  };

  return (
    <div className="bg-dark-850 rounded-2xl border border-dark-750 p-5 shadow-xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Zap className="w-5 h-5 fill-current" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              ERC-4337 Execution Arena
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-garden-500/10 text-garden-400 border border-garden-500/20">
                Gas Sponsored
              </span>
            </h3>
            <p className="text-xs text-gray-400">
              Dispatch UserOperations governed by inherited tree policies & paymasters.
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-gray-400 block">Acting as Signer</span>
          <span className="text-xs font-bold text-amber-400 flex items-center gap-1 justify-end">
            {activePersonaNode.label}
          </span>
        </div>
      </div>

      {/* Revocation Warning if active persona branch is pruned */}
      {isRevoked && (
        <div className="bg-red-950/40 border border-red-500/40 rounded-xl p-3 text-xs text-red-200 flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">Cascading Revocation Detected:</span>
            <span className="text-red-300/80">{status.reason}</span>
          </div>
        </div>
      )}

      {/* Quick Action Presets */}
      <div>
        <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block mb-2">
          1. Choose Action / Target Contract
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {MOCK_TARGETS.map((t, idx) => (
            <button
              key={t.address}
              onClick={() => {
                setSelectedTargetIndex(idx);
                setSelectedFuncIndex(0);
                const defaultAmt = t.functions[0]?.defaultArgs?.amount || t.functions[0]?.defaultArgs?.budgetUsed || '0.1';
                setAmountEth(defaultAmt);
              }}
              className={"p-2.5 rounded-xl border text-left transition-all " +
                (selectedTargetIndex === idx
                  ? "bg-dark-800 border-garden-500 text-white ring-1 ring-garden-500/30"
                  : "bg-dark-900/80 border-dark-750 text-gray-400 hover:text-gray-200 hover:bg-dark-800")}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold text-garden-400 uppercase">{t.category}</span>
                <span className="text-[10px] font-mono text-gray-500">
                  {t.address.slice(0, 4)}...{t.address.slice(-2)}
                </span>
              </div>
              <div className="font-semibold text-xs text-gray-200 truncate">{t.name.split('(')[0]}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Function & Parameter Configuration */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-dark-900/80 p-3 rounded-xl border border-dark-750 text-xs">
        <div>
          <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block mb-1">
            Function Selector & Call
          </label>
          <select
            value={selectedFuncIndex}
            onChange={(e) => {
              const idx = parseInt(e.target.value);
              setSelectedFuncIndex(idx);
              const defaultAmt = target.functions[idx]?.defaultArgs?.amount || target.functions[idx]?.defaultArgs?.budgetUsed || '0.1';
              setAmountEth(defaultAmt);
            }}
            className="w-full bg-dark-800 border border-dark-700 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-garden-500 font-mono"
          >
            {target.functions.map((fn, idx) => (
              <option key={fn.selector} value={idx}>
                {fn.signature} ({fn.selector})
              </option>
            ))}
          </select>
          <span className="text-[10px] text-gray-500 mt-1 block">
            {func.description}
          </span>
        </div>

        <div>
          <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block mb-1">
            Spend Value (ETH)
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.01"
              min="0"
              value={amountEth}
              onChange={(e) => setAmountEth(e.target.value)}
              className="w-full bg-dark-800 border border-dark-700 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-garden-500 font-mono"
              placeholder="0.05"
            />
            <span className="absolute right-3 top-2 text-xs font-bold text-gray-400">ETH</span>
          </div>
          <span className="text-[10px] text-gray-500 mt-1 block">
            Max permitted for this node: {activePersonaNode.policy.maxSpendPerTx || '∞'} ETH
          </span>
        </div>
      </div>

      {/* Paymaster Sponsorship Badge */}
      <div className="flex items-center justify-between bg-dark-900/60 px-3 py-2 rounded-xl border border-dark-750 text-xs">
        <div className="flex items-center gap-2">
          <Fuel className="w-4 h-4 text-garden-400" />
          <span className="text-gray-300">ERC-4337 Paymaster:</span>
          <span className="font-mono text-[11px] text-garden-400">
            {PAYMASTER_CONTRACT_ADDRESS.slice(0, 8)}...
          </span>
        </div>
        <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
          Gas Sponsored (0.00042 ETH saved)
        </span>
      </div>

      {/* Execution Trigger Button */}
      <button
        onClick={handleExecute}
        disabled={isExecuting}
        className={"w-full py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all shadow-lg " +
          (isExecuting
            ? "bg-dark-700 cursor-not-allowed text-gray-400"
            : isRevoked
            ? "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 shadow-red-600/20"
            : "bg-gradient-to-r from-garden-600 to-garden-500 hover:from-garden-500 hover:to-garden-400 shadow-garden-600/20")}
      >
        {isExecuting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-garden-400" />
            <span>Validating Hierarchical Lineage & Executing UserOp...</span>
          </>
        ) : (
          <>
            <Send className="w-4 h-4" />
            <span>
              {isRevoked
                ? 'Test Blocked Execution (Demonstrate Pruned Branch Error)'
                : `Dispatch UserOp as ${activePersonaNode.label} (${amountEth} ETH)`}
            </span>
          </>
        )}
      </button>

      {/* Last Execution Outcome Feedback */}
      {lastExecutedLog && (
        <div
          className={"rounded-xl p-4 border text-xs space-y-2 " +
            (lastExecutedLog.status === 'SUCCESS'
              ? "bg-garden-950/20 border-garden-500/40 text-garden-200"
              : "bg-red-950/20 border-red-500/40 text-red-200")}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-bold text-sm">
              {lastExecutedLog.status === 'SUCCESS' ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-garden-400" />
                  <span>UserOperation Executed Successfully!</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span>UserOperation Reverted / Blocked</span>
                </>
              )}
            </div>
            <button
              onClick={() => setShowRawUserOp(!showRawUserOp)}
              className="text-[11px] font-semibold text-gray-400 hover:text-white flex items-center gap-1 bg-dark-900/80 px-2 py-1 rounded border border-dark-750"
            >
              <Code2 className="w-3 h-3" />
              {showRawUserOp ? 'Hide UserOp JSON' : 'Inspect Raw UserOp'}
            </button>
          </div>

          {lastExecutedLog.revertReason && (
            <p className="font-semibold text-red-300 bg-red-950/50 p-2.5 rounded-lg border border-red-500/30">
              {lastExecutedLog.revertReason}
            </p>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-gray-300 pt-1">
            <div>
              <span className="text-gray-500 block text-[10px]">UserOp Hash</span>
              <span className="font-mono">{lastExecutedLog.userOpHash.slice(0, 10)}...</span>
            </div>
            <div>
              <span className="text-gray-500 block text-[10px]">Signer</span>
              <span className="font-mono">{lastExecutedLog.callerSigner.slice(0, 8)}...</span>
            </div>
            <div>
              <span className="text-gray-500 block text-[10px]">Target</span>
              <span>{lastExecutedLog.targetName.split('(')[0]}</span>
            </div>
            <div>
              <span className="text-gray-500 block text-[10px]">Gas Sponsored</span>
              <span className="text-emerald-400 font-bold">
                {lastExecutedLog.gasSponsored ? 'Yes (100%)' : 'No'}
              </span>
            </div>
          </div>

          {/* Raw UserOp Inspector Drawer */}
          {showRawUserOp && lastExecutedLog.rawUserOp && (
            <div className="mt-3 pt-3 border-t border-dark-750">
              <span className="text-[10px] font-bold uppercase text-gray-400 block mb-1">
                ERC-4337 UserOperation Struct:
              </span>
              <pre className="bg-dark-900 p-3 rounded-lg text-[10px] font-mono text-gray-300 overflow-x-auto border border-dark-750 max-h-48">
                {JSON.stringify(lastExecutedLog.rawUserOp, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

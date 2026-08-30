'use client';

import React, { useState } from 'react';
import { useGarden } from '../context/GardenContext';
import { MOCK_TARGETS, PAYMASTER_CONTRACT_ADDRESS } from '../lib/constants';
import { isNodeAndAncestorsActive, getAllNodes } from '../lib/garden-engine';
import {
  Zap,
  Send,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  ShieldAlert,
  Loader2,
  ChevronRight,
  Code2,
  Layers,
  Fuel
} from 'lucide-react';

export const ExecutionConsole: React.FC = () => {
  const {
    tree,
    activePersonaId,
    activePersonaNode,
    setActivePersona,
    executeAction,
    isExecuting
  } = useGarden();

  const [selectedTargetIndex, setSelectedTargetIndex] = useState<number>(2); // Default to Social Campaign
  const [selectedFuncIndex, setSelectedFuncIndex] = useState<number>(0);
  const [amountEth, setAmountEth] = useState<string>('0.05');
  const [customArgs, setCustomArgs] = useState<string>('Campaign: Devcon IIITN Community Grant');
  const [lastExecutedLog, setLastExecutedLog] = useState<any | null>(null);
  const [showRawUserOp, setShowRawUserOp] = useState<boolean>(false);

  const allAvailableNodes = getAllNodes(tree);

  if (!activePersonaNode) {
    return (
      <div className="bg-surface-900 rounded-2xl border border-surface-750 p-6 text-center text-warm-400">
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
    <div className="bg-surface-900 rounded-2xl border border-surface-750 p-5 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-surface-800 border border-surface-700 text-amber-400">
            <Zap className="w-4 h-4 fill-current" />
          </div>
          <div>
            <h3 className="text-base font-bold text-warm-50 tracking-tight flex items-center gap-2">
              Transaction Dispatcher
              <span className="text-[10px] font-medium tracking-wide uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Paymaster Sponsored
              </span>
            </h3>
            <p className="text-xs text-warm-400">
              Dispatch ERC-4337 UserOperations validated against the hierarchical policy tree.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Signer Persona Selector Bar */}
      <div className="space-y-1.5 bg-surface-950/60 p-3 rounded-xl border border-surface-800">
        <span className="text-[10px] uppercase font-semibold text-warm-400 tracking-wider block">
          Switch Acting Signer Persona
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {allAvailableNodes.slice(0, 4).map((node) => {
            const isCurrent = activePersonaId === node.nodeId;
            const nodeStatus = isNodeAndAncestorsActive(tree, node.nodeId);
            return (
              <button
                key={node.nodeId}
                onClick={() => setActivePersona(node.nodeId)}
                className={`p-2 rounded-lg text-left transition-all border text-xs flex flex-col justify-between ${
                  isCurrent
                    ? 'bg-amber-500/10 border-amber-400/40 text-warm-50 shadow-sm'
                    : 'bg-surface-900 border-surface-800 text-warm-400 hover:text-warm-200 hover:border-surface-700'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-[9px] font-mono text-warm-500">L{node.depth}</span>
                  {!nodeStatus.active && (
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  )}
                  {isCurrent && nodeStatus.active && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  )}
                </div>
                <span className="font-semibold truncate text-[11px] block">{node.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Revocation Warning Alert */}
      {isRevoked && (
        <div className="bg-rose-950/40 border border-rose-800/60 rounded-xl p-3 text-xs text-rose-200 flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">Cascading Revocation In Effect</span>
            <span className="text-rose-300/80 leading-relaxed text-[11px]">{status.reason}</span>
          </div>
        </div>
      )}

      {/* Target & Function Configuration Form */}
      <div className="space-y-3 bg-surface-950/40 p-4 rounded-xl border border-surface-800">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {/* Target Contract Selector */}
          <div>
            <label className="text-[10px] uppercase font-semibold text-warm-400 block mb-1">
              Target Protocol Contract
            </label>
            <select
              value={selectedTargetIndex}
              onChange={(e) => {
                setSelectedTargetIndex(Number(e.target.value));
                setSelectedFuncIndex(0);
              }}
              className="w-full bg-surface-900 border border-surface-750 rounded-lg px-3 py-2 text-xs text-warm-100 focus:outline-none focus:border-amber-400"
            >
              {MOCK_TARGETS.map((t, idx) => (
                <option key={t.address} value={idx}>
                  {t.name} ({t.category})
                </option>
              ))}
            </select>
            <span className="text-[10px] font-mono text-warm-500 block mt-1">
              {target.address}
            </span>
          </div>

          {/* Function Selector */}
          <div>
            <label className="text-[10px] uppercase font-semibold text-warm-400 block mb-1">
              Function Selector
            </label>
            <select
              value={selectedFuncIndex}
              onChange={(e) => setSelectedFuncIndex(Number(e.target.value))}
              className="w-full bg-surface-900 border border-surface-750 rounded-lg px-3 py-2 text-xs text-warm-100 focus:outline-none focus:border-amber-400"
            >
              {target.functions.map((f, idx) => (
                <option key={f.selector} value={idx}>
                  {f.selector} — {f.signature.split('(')[0]}
                </option>
              ))}
            </select>
            <span className="text-[10px] text-warm-400 block mt-1 truncate">
              {func.description}
            </span>
          </div>
        </div>

        {/* Value & Call Memo Arguments */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
          <div>
            <label className="text-[10px] uppercase font-semibold text-warm-400 block mb-1">
              Value (ETH)
            </label>
            <input
              type="text"
              value={amountEth}
              onChange={(e) => setAmountEth(e.target.value)}
              className="w-full bg-surface-900 border border-surface-750 rounded-lg px-3 py-2 text-xs text-warm-100 font-mono focus:outline-none focus:border-amber-400"
              placeholder="0.0"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="text-[10px] uppercase font-semibold text-warm-400 block mb-1">
              Calldata Summary / Arguments Memo
            </label>
            <input
              type="text"
              value={customArgs}
              onChange={(e) => setCustomArgs(e.target.value)}
              className="w-full bg-surface-900 border border-surface-750 rounded-lg px-3 py-2 text-xs text-warm-100 focus:outline-none focus:border-amber-400"
              placeholder="Memo / argument metadata"
            />
          </div>
        </div>
      </div>

      {/* Primary Action Button */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleExecute}
          disabled={isExecuting}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-sm ${
            isExecuting
              ? 'bg-surface-800 text-warm-400 cursor-not-allowed'
              : 'bg-amber-500 hover:bg-amber-400 text-surface-950'
          }`}
        >
          {isExecuting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
              <span>Verifying Lineage & Bundling UserOp...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Dispatch via Smart Account</span>
            </>
          )}
        </button>
      </div>

      {/* Live Result Feedback Card */}
      {lastExecutedLog && (
        <div
          className={`p-3.5 rounded-xl border text-xs space-y-2.5 transition-all ${
            lastExecutedLog.status === 'SUCCESS'
              ? 'bg-emerald-950/20 border-emerald-800/50'
              : 'bg-rose-950/20 border-rose-800/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {lastExecutedLog.status === 'SUCCESS' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-400" />
              )}
              <span
                className={`font-semibold ${
                  lastExecutedLog.status === 'SUCCESS' ? 'text-emerald-300' : 'text-rose-300'
                }`}
              >
                {lastExecutedLog.status === 'SUCCESS'
                  ? 'UserOperation Successfully Validated & Executed'
                  : `Execution Reverted: ${lastExecutedLog.revertReason}`}
              </span>
            </div>

            <span className="text-[10px] font-mono text-warm-400">
              {new Date(lastExecutedLog.timestamp).toLocaleTimeString()}
            </span>
          </div>

          {/* Key Details */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] pt-1 text-warm-300">
            <div>
              <span className="text-warm-500 block text-[10px]">UserOp Hash</span>
              <span className="font-mono">{lastExecutedLog.userOpHash.slice(0, 8)}...</span>
            </div>
            <div>
              <span className="text-warm-500 block text-[10px]">Gas Fee</span>
              <span className="font-mono text-emerald-400 font-medium">0.00 ETH (Sponsored)</span>
            </div>
            <div>
              <span className="text-warm-500 block text-[10px]">Value Disbursed</span>
              <span className="font-mono">{lastExecutedLog.valueEth} ETH</span>
            </div>
            <div>
              <span className="text-warm-500 block text-[10px]">Ancestors Verified</span>
              <span className="font-mono">{lastExecutedLog.lineagePath.length} Nodes</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

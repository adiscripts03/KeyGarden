'use client';

import React, { useState } from 'react';
import { useGarden } from '../context/GardenContext';
import { ExecutionLog } from '../types/garden';
import {
  ListFilter,
  CheckCircle2,
  AlertTriangle,
  Code2,
  Trash2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Fuel,
  ArrowRight
} from 'lucide-react';

export const ActivityLog: React.FC = () => {
  const { executionLogs, clearLogs } = useGarden();
  const [filter, setFilter] = useState<'ALL' | 'SUCCESS' | 'REVERTED'>('ALL');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const filteredLogs = executionLogs.filter((log) => {
    if (filter === 'ALL') return true;
    return log.status === filter;
  });

  return (
    <div className="bg-dark-850 rounded-2xl border border-dark-750 p-5 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-white tracking-tight">
            Live Execution & Audit Trail
          </h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-dark-800 text-gray-400 border border-dark-700">
            {executionLogs.length} Events
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter */}
          <div className="flex items-center bg-dark-900 rounded-lg p-0.5 border border-dark-750 text-xs">
            <button
              onClick={() => setFilter('ALL')}
              className={"px-2.5 py-1 rounded-md font-medium transition-colors " +
                (filter === 'ALL' ? "bg-dark-750 text-white" : "text-gray-400 hover:text-white")}
            >
              All
            </button>
            <button
              onClick={() => setFilter('SUCCESS')}
              className={"px-2.5 py-1 rounded-md font-medium transition-colors " +
                (filter === 'SUCCESS' ? "bg-garden-500/20 text-garden-400" : "text-gray-400 hover:text-white")}
            >
              Success
            </button>
            <button
              onClick={() => setFilter('REVERTED')}
              className={"px-2.5 py-1 rounded-md font-medium transition-colors " +
                (filter === 'REVERTED' ? "bg-red-500/20 text-red-400" : "text-gray-400 hover:text-white")}
            >
              Blocked
            </button>
          </div>

          {executionLogs.length > 0 && (
            <button
              onClick={clearLogs}
              title="Clear log history"
              className="p-1.5 text-gray-500 hover:text-gray-300 rounded-lg hover:bg-dark-800"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Log List */}
      {filteredLogs.length === 0 ? (
        <div className="text-center py-8 text-xs text-gray-500 bg-dark-900/40 rounded-xl border border-dark-750">
          No UserOperation transactions recorded yet. Use the Execution Arena above to test sub-account actions!
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
          {filteredLogs.map((log) => {
            const isExpanded = expandedLogId === log.id;
            const timeStr = new Date(log.timestamp * 1000).toLocaleTimeString();

            return (
              <div
                key={log.id}
                className={"rounded-xl p-3 border transition-all text-xs " +
                  (log.status === 'SUCCESS'
                    ? "bg-dark-900/90 border-dark-750 hover:border-dark-600"
                    : "bg-red-950/20 border-red-500/30 hover:border-red-500/40")}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    {log.status === 'SUCCESS' ? (
                      <CheckCircle2 className="w-4 h-4 text-garden-400 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                    )}
                    <span className="font-bold text-white">{log.nodeLabel}</span>
                    <span className="text-gray-500 text-[10px]">•</span>
                    <span className="text-gray-400 font-mono text-[10px]">{timeStr}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {log.gasSponsored && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                        <Fuel className="w-2.5 h-2.5" />
                        Sponsored
                      </span>
                    )}
                    <button
                      onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                      className="text-gray-400 hover:text-white p-1 rounded hover:bg-dark-800"
                    >
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Call summary */}
                <div className="flex items-center justify-between text-gray-300">
                  <div className="truncate max-w-[280px] sm:max-w-md">
                    <span className="text-gray-500">Target:</span> {log.targetName.split('(')[0]}
                    <span className="text-gray-500 ml-2">Func:</span> <code className="font-mono text-garden-400">{log.functionSignature.split('(')[0]}</code>
                  </div>
                  <div className="font-mono font-semibold text-white shrink-0">
                    {log.valueEth} ETH
                  </div>
                </div>

                {/* Error reason if reverted */}
                {log.revertReason && (
                  <div className="mt-2 p-2 rounded bg-red-950/60 border border-red-500/30 text-red-300 text-[11px] font-mono">
                    {log.revertReason}
                  </div>
                )}

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-dark-750 space-y-2 text-[11px]">
                    {/* Lineage */}
                    <div>
                      <span className="text-gray-400 block text-[10px] uppercase font-bold mb-1">
                        Lineage Path Verified:
                      </span>
                      <div className="flex items-center flex-wrap gap-1">
                        {log.lineagePath.map((p, i) => (
                          <React.Fragment key={i}>
                            <span className="px-1.5 py-0.5 rounded bg-dark-800 text-gray-300 border border-dark-700 font-mono">
                              {p}
                            </span>
                            {i < log.lineagePath.length - 1 && (
                              <ArrowRight className="w-2.5 h-2.5 text-gray-600" />
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-gray-300 font-mono text-[10px] pt-1">
                      <div>
                        <span className="text-gray-500 block">UserOp Hash:</span>
                        <span className="truncate block">{log.userOpHash}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block">Signer EOA:</span>
                        <span className="truncate block">{log.callerSigner}</span>
                      </div>
                    </div>

                    {/* Raw UserOp JSON */}
                    {log.rawUserOp && (
                      <div className="pt-1">
                        <span className="text-gray-500 block text-[10px] font-bold uppercase mb-1">
                          Raw ERC-4337 UserOp:
                        </span>
                        <pre className="bg-dark-900 p-2.5 rounded-lg border border-dark-750 overflow-x-auto text-[10px] font-mono text-gray-300 max-h-36">
                          {JSON.stringify(log.rawUserOp, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

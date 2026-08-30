'use client';

import React from 'react';
import { useGarden } from '../context/GardenContext';
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  Fuel,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Trash2
} from 'lucide-react';

export const ActivityLog: React.FC = () => {
  const { executionLogs, clearLogs } = useGarden();
  const [expandedLogId, setExpandedLogId] = React.useState<string | null>(null);

  if (executionLogs.length === 0) {
    return (
      <div className="bg-surface-900 rounded-2xl border border-surface-750 p-6 text-center shadow-sm">
        <FileText className="w-7 h-7 text-warm-500 mx-auto mb-2" />
        <h4 className="text-warm-200 font-semibold text-sm">No Audit Logs Yet</h4>
        <p className="text-warm-400 text-xs mt-1">
          Dispatch a UserOperation from the Execution Console above to generate live cryptographic audit traces.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-surface-900 rounded-2xl border border-surface-750 p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-bold text-warm-50 tracking-tight">
            Cryptographic Audit Ledger
          </h3>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-surface-800 text-warm-300 border border-surface-750">
            {executionLogs.length} Events
          </span>
        </div>

        <button
          onClick={clearLogs}
          className="text-warm-400 hover:text-warm-200 text-xs flex items-center gap-1 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear Logs</span>
        </button>
      </div>

      {/* Logs List */}
      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
        {executionLogs.map((log) => {
          const isExpanded = expandedLogId === log.id;
          const isSuccess = log.status === 'SUCCESS';

          return (
            <div
              key={log.id}
              className={`rounded-xl border transition-all text-xs ${
                isSuccess
                  ? 'bg-surface-950/60 border-surface-800 hover:border-surface-700'
                  : 'bg-rose-950/20 border-rose-900/40 hover:border-rose-800/60'
              }`}
            >
              <div
                onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                className="p-3 flex items-center justify-between cursor-pointer gap-2"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {isSuccess ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-warm-100 truncate">{log.nodeLabel}</span>
                      <span className="text-[10px] font-mono text-warm-500">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <span className="text-[11px] text-warm-400 block truncate">
                      {log.targetName} • {log.functionSelector}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className="font-mono text-warm-200 block text-[11px]">
                      {log.valueEth} ETH
                    </span>
                    <span className="text-[9px] font-medium text-emerald-400 uppercase">
                      Sponsored
                    </span>
                  </div>

                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-warm-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-warm-400" />
                  )}
                </div>
              </div>

              {/* Expandable Trace Details */}
              {isExpanded && (
                <div className="p-3 pt-0 border-t border-surface-850 text-[11px] space-y-2 mt-1">
                  {!isSuccess && (
                    <div className="p-2 rounded-lg bg-rose-950/40 border border-rose-800 text-rose-300">
                      <strong>Revert Reason:</strong> {log.revertReason}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 text-warm-400">
                    <div>
                      <span className="text-warm-500 block text-[10px]">UserOp Hash:</span>
                      <span className="font-mono text-warm-300">{log.userOpHash}</span>
                    </div>
                    <div>
                      <span className="text-warm-500 block text-[10px]">Target Contract:</span>
                      <span className="font-mono text-warm-300">{log.targetAddress}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-warm-500 block text-[10px] mb-1">
                      Lineage Check Chain:
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {log.lineagePath.map((nodeLabel, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded bg-surface-900 border border-surface-750 font-mono text-[10px] text-warm-300"
                        >
                          {nodeLabel}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

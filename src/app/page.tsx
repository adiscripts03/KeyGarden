'use client';

import React, { useState } from 'react';
import { Navbar } from '../components/Navbar';
import { TreeVisualizer } from '../components/TreeVisualizer';
import { NodeDetailPanel } from '../components/NodeDetailPanel';
import { ExecutionConsole } from '../components/ExecutionConsole';
import { ActivityLog } from '../components/ActivityLog';
import { PolicyBuilderModal } from '../components/PolicyBuilderModal';
import { BranchPruneModal } from '../components/BranchPruneModal';
import { InteractiveTour } from '../components/InteractiveTour';
import { useGarden } from '../context/GardenContext';
import {
  TreePine,
  GitBranch,
  ShieldCheck,
  Zap,
  Scissors,
  Fuel,
  Coins,
  Layers,
  Info
} from 'lucide-react';

export default function HomePage() {
  const { stats } = useGarden();

  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState<boolean>(false);
  const [parentForNewChild, setParentForNewChild] = useState<string | null>(null);

  const [isPruneModalOpen, setIsPruneModalOpen] = useState<boolean>(false);
  const [nodeToPrune, setNodeToPrune] = useState<string | null>(null);

  const handleOpenPolicyBuilder = (parentNodeId: string) => {
    setParentForNewChild(parentNodeId);
    setIsPolicyModalOpen(true);
  };

  const handleOpenPruneModal = (nodeId: string) => {
    setNodeToPrune(nodeId);
    setIsPruneModalOpen(true);
  };

  return (
    <div className="flex flex-col min-h-screen bg-surface-950 text-warm-100">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full space-y-6">
        {/* Top Header & Metrics Section */}
        <div className="bg-surface-900 rounded-2xl border border-surface-750 p-6 shadow-sm">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  ROAD TO DEVCON – IIITN EDITION
                </span>
                <span className="text-[11px] text-warm-500 font-mono">IIIT Nagpur × Bhaisaaab</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-warm-50 tracking-tight">
                Hierarchical Account Abstraction Trees
              </h1>
              <p className="text-xs sm:text-sm text-warm-400 leading-relaxed">
                A root treasury account issues departmental sub-accounts that issue team-level and bot keys, each inheriting and strictly narrowing policies. 
                <strong className="text-warm-200"> Revoking a branch cryptographically severs downstream access in 1 transaction.</strong>
              </p>
            </div>

            {/* Quick Metrics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full lg:w-auto">
              <div className="bg-surface-950 p-3 rounded-xl border border-surface-800 text-center min-w-[105px]">
                <span className="text-[10px] uppercase font-semibold text-warm-500 block">Total Nodes</span>
                <span className="text-lg font-bold text-warm-100 font-mono">{stats.totalNodes}</span>
              </div>

              <div className="bg-surface-950 p-3 rounded-xl border border-surface-800 text-center min-w-[105px]">
                <span className="text-[10px] uppercase font-semibold text-emerald-400 block">Active Keys</span>
                <span className="text-lg font-bold text-emerald-400 font-mono">{stats.activeNodes}</span>
              </div>

              <div className="bg-surface-950 p-3 rounded-xl border border-surface-800 text-center min-w-[105px]">
                <span className="text-[10px] uppercase font-semibold text-rose-400 block">Pruned Keys</span>
                <span className="text-lg font-bold text-rose-400 font-mono">{stats.revokedNodes}</span>
              </div>

              <div className="bg-surface-950 p-3 rounded-xl border border-surface-800 text-center min-w-[105px]">
                <span className="text-[10px] uppercase font-semibold text-amber-400 block">Paymaster Gas</span>
                <span className="text-lg font-bold text-amber-400 font-mono">100% Free</span>
              </div>
            </div>
          </div>
        </div>

        {/* Account Tree Canvas Visualizer */}
        <section className="bg-surface-900 rounded-2xl border border-surface-750 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-surface-750 flex items-center justify-between flex-wrap gap-3 bg-surface-950/40">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-surface-850 border border-surface-750 text-amber-400">
                <GitBranch className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-warm-50 tracking-tight">
                  Organizational Account Tree
                </h2>
                <p className="text-[11px] text-warm-400">
                  Select any node to inspect lineage proof, issue child sub-accounts, or prune intermediate branches.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-warm-300">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Active Lineage
              </span>
              <span className="flex items-center gap-1.5 text-warm-300">
                <span className="w-2 h-2 rounded-full bg-rose-500" /> Pruned / Revoked Branch
              </span>
            </div>
          </div>

          {/* Render Visual Tree Canvas */}
          <TreeVisualizer
            onOpenPolicyBuilder={handleOpenPolicyBuilder}
            onOpenPruneModal={handleOpenPruneModal}
          />
        </section>

        {/* Bottom 2-Column Split: Execution Console + Node Details */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Execution Console & Activity Ledger (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <ExecutionConsole />
            <ActivityLog />
          </div>

          {/* Right Column: Node Details & Lineage Inspector (5 cols) */}
          <div className="lg:col-span-5">
            <div className="sticky top-20">
              <NodeDetailPanel
                onOpenPolicyBuilder={handleOpenPolicyBuilder}
                onOpenPruneModal={handleOpenPruneModal}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-surface-750 bg-surface-950 py-6 mt-12 text-xs text-warm-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <TreePine className="w-4 h-4 text-amber-400" />
            <span className="font-semibold text-warm-300">KeyGarden</span>
            <span>— Built for Road to Devcon (IIITN Edition)</span>
          </div>
          <div className="flex items-center gap-4 text-warm-400">
            <span>ERC-4337 Account Abstraction</span>
            <span>•</span>
            <span>Cascading Revocation</span>
            <span>•</span>
            <span>Policy Narrowing</span>
          </div>
        </div>
      </footer>

      {/* Modals & Overlays */}
      <PolicyBuilderModal
        isOpen={isPolicyModalOpen}
        onClose={() => setIsPolicyModalOpen(false)}
        parentNodeId={parentForNewChild}
      />

      <BranchPruneModal
        isOpen={isPruneModalOpen}
        onClose={() => setIsPruneModalOpen(false)}
        nodeIdToPrune={nodeToPrune}
      />

      <InteractiveTour />
    </div>
  );
}

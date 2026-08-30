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
  ShieldCheck,
  Zap,
  Scissors,
  Fuel,
  Coins,
  Layers,
  ArrowDown,
  Info,
  Sparkles,
  GitBranch,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';

export default function HomePage() {
  const { stats, tree } = useGarden();

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
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full space-y-6">
        {/* Top Hero Banner & Metrics */}
        <div className="bg-gradient-to-r from-dark-850 via-dark-800 to-dark-850 rounded-2xl border border-dark-750 p-6 shadow-xl relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-garden-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-garden-500/10 text-garden-400 border border-garden-500/20">
                  ROAD TO DEVCON – IIITN EDITION
                </span>
                <span className="text-[11px] text-gray-400 font-mono">IIIT Nagpur × Bhaisaaab</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                KeyGarden: Hierarchical Account Abstraction Trees
              </h1>
              <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                A root account issues departmental sub-accounts, which issue individual team ones, each inheriting and narrowing policies. 
                <strong className="text-white"> Revoking a branch cryptographically revokes everything under it in 1 transaction.</strong>
              </p>
            </div>

            {/* Quick Metrics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full lg:w-auto">
              <div className="bg-dark-900/90 p-3 rounded-xl border border-dark-750 text-center min-w-[100px]">
                <span className="text-[10px] uppercase font-bold text-gray-400 block">Total Nodes</span>
                <span className="text-lg font-bold text-white font-mono">{stats.totalNodes}</span>
              </div>

              <div className="bg-dark-900/90 p-3 rounded-xl border border-dark-750 text-center min-w-[100px]">
                <span className="text-[10px] uppercase font-bold text-emerald-400 block">Active Keys</span>
                <span className="text-lg font-bold text-emerald-400 font-mono">{stats.activeNodes}</span>
              </div>

              <div className="bg-dark-900/90 p-3 rounded-xl border border-dark-750 text-center min-w-[100px]">
                <span className="text-[10px] uppercase font-bold text-red-400 block">Pruned Keys</span>
                <span className="text-lg font-bold text-red-400 font-mono">{stats.revokedNodes}</span>
              </div>

              <div className="bg-dark-900/90 p-3 rounded-xl border border-dark-750 text-center min-w-[100px]">
                <span className="text-[10px] uppercase font-bold text-garden-400 block">Paymaster Gas</span>
                <span className="text-lg font-bold text-garden-400 font-mono">100% Free</span>
              </div>
            </div>
          </div>
        </div>

        {/* Account Tree Canvas Visualizer Card */}
        <section className="bg-dark-850 rounded-2xl border border-dark-750 shadow-xl overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-dark-750 flex items-center justify-between flex-wrap gap-3 bg-dark-900/40">
            <div className="flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-garden-400" />
              <div>
                <h2 className="text-sm font-bold text-white tracking-tight">
                  Interactive Account Tree Visualizer
                </h2>
                <p className="text-[11px] text-gray-400">
                  Click any node to inspect lineage proof, issue child sub-accounts, or prune branches.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1.5 text-gray-300">
                <span className="w-2.5 h-2.5 rounded-full bg-garden-500" /> Active Lineage
              </span>
              <span className="flex items-center gap-1.5 text-gray-300 ml-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Pruned / Revoked Branch
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
          {/* Left Column: Execution Console & Activity Audit (7 cols) */}
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
      <footer className="border-t border-dark-750 bg-dark-900/90 py-6 mt-12 text-xs text-gray-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <TreePine className="w-4 h-4 text-garden-400" />
            <span className="font-semibold text-gray-300">KeyGarden</span>
            <span>— Built for Road to Devcon (IIITN Edition)</span>
          </div>
          <div className="flex items-center gap-4 text-gray-400">
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

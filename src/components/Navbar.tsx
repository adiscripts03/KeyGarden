'use client';

import React from 'react';
import { useGarden } from '../context/GardenContext';
import { ROOT_SMART_ACCOUNT } from '../lib/constants';
import { TreePine, Sparkles, Shield, RotateCcw, Play, CheckCircle2, Zap, AlertTriangle, GitFork } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { tree, stats, activePersonaNode, loadPreset, startTour, isTourActive } = useGarden();

  return (
    <header className="border-b border-dark-750 bg-dark-900/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand & Event Tag */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-garden-500 to-garden-700 flex items-center justify-center shadow-lg shadow-garden-500/20 ring-1 ring-garden-400/30">
            <TreePine className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-white tracking-tight">KeyGarden</span>
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-garden-500/10 text-garden-400 border border-garden-500/20">
                ERC-4337 Tree AA
              </span>
            </div>
            <div className="text-[11px] text-gray-400 flex items-center gap-1.5">
              <span>Road to Devcon – IIITN Edition</span>
              <span className="text-gray-600">•</span>
              <span className="text-gray-400">Hierarchical Account Abstraction</span>
            </div>
          </div>
        </div>

        {/* Middle: Active Persona & Smart Account Info */}
        <div className="hidden md:flex items-center gap-3 bg-dark-850 px-3 py-1.5 rounded-xl border border-dark-750 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-gray-400">Root Treasury:</span>
            <span className="font-mono text-gray-200 text-[11px]">
              {ROOT_SMART_ACCOUNT.slice(0, 6)}...{ROOT_SMART_ACCOUNT.slice(-4)}
            </span>
          </div>
          <div className="h-3.5 w-px bg-dark-700" />
          <div className="flex items-center gap-1.5">
            <span className="text-gray-400">Active Persona:</span>
            <span className="font-medium text-garden-400 flex items-center gap-1">
              <Zap className="w-3 h-3" />
              {activePersonaNode ? activePersonaNode.label : 'None'}
            </span>
          </div>
        </div>

        {/* Right: Quick Actions & Preset Selector */}
        <div className="flex items-center gap-2">
          {/* Quick Tour Button */}
          <button
            onClick={startTour}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-garden-600 to-garden-500 text-white hover:from-garden-500 hover:to-garden-400 transition-all shadow-md shadow-garden-600/20"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>2-Min Demo Tour</span>
          </button>

          {/* Preset Selector */}
          <div className="relative group">
            <button className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-dark-800 text-gray-300 hover:bg-dark-750 border border-dark-700 hover:text-white transition-colors">
              <GitFork className="w-3.5 h-3.5 text-garden-400" />
              <span className="hidden sm:inline">Presets</span>
            </button>
            <div className="absolute right-0 mt-1 w-52 py-1.5 bg-dark-850 rounded-xl border border-dark-700 shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all z-50">
              <div className="px-3 py-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                Select Demo Tree
              </div>
              <button
                onClick={() => loadPreset('dao')}
                className="w-full text-left px-3 py-2 text-xs text-gray-200 hover:bg-dark-750 flex items-center justify-between"
              >
                <span>🌐 Global Web3 DAO</span>
                <span className="text-[10px] text-gray-500">Default</span>
              </button>
              <button
                onClick={() => loadPreset('enterprise')}
                className="w-full text-left px-3 py-2 text-xs text-gray-200 hover:bg-dark-750 flex items-center justify-between"
              >
                <span>🏢 Enterprise FinTech</span>
              </button>
              <button
                onClick={() => loadPreset('blank')}
                className="w-full text-left px-3 py-2 text-xs text-gray-200 hover:bg-dark-750 flex items-center justify-between"
              >
                <span>🌱 Blank Root Canvas</span>
              </button>
            </div>
          </div>

          {/* Reset Button */}
          <button
            onClick={() => loadPreset('dao')}
            title="Reset to DAO Template"
            className="p-1.5 text-gray-400 hover:text-white bg-dark-800 hover:bg-dark-750 rounded-lg border border-dark-700 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

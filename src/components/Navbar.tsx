'use client';

import React from 'react';
import { useGarden } from '../context/GardenContext';
import { ROOT_SMART_ACCOUNT } from '../lib/constants';
import { TreePine, Play, RotateCcw, GitFork, Zap } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { activePersonaNode, loadPreset, startTour } = useGarden();

  return (
    <header className="border-b border-surface-750 bg-surface-950/95 backdrop-blur-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand & Event Tag */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-surface-850 border border-surface-700 flex items-center justify-center text-amber-400 shadow-sm">
            <TreePine className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-base text-warm-50 tracking-tight">KeyGarden</span>
              <span className="text-[10px] font-medium tracking-wide uppercase px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/20">
                ERC-4337 Tree AA
              </span>
            </div>
            <div className="text-[11px] text-warm-400 flex items-center gap-1.5 font-normal">
              <span>Road to Devcon – IIITN Edition</span>
              <span className="text-warm-600">•</span>
              <span className="text-warm-400">Hierarchical Account Abstraction</span>
            </div>
          </div>
        </div>

        {/* Middle: Active Persona & Smart Account Info */}
        <div className="hidden md:flex items-center gap-3 bg-surface-900 px-3.5 py-1.5 rounded-xl border border-surface-750 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-warm-400">Root Account:</span>
            <span className="font-mono text-warm-200 text-[11px]">
              {ROOT_SMART_ACCOUNT.slice(0, 6)}...{ROOT_SMART_ACCOUNT.slice(-4)}
            </span>
          </div>
          <div className="h-3 w-px bg-surface-750" />
          <div className="flex items-center gap-1.5">
            <span className="text-warm-400">Acting Signer:</span>
            <span className="font-medium text-amber-300 flex items-center gap-1">
              <Zap className="w-3 h-3 fill-current" />
              {activePersonaNode ? activePersonaNode.label : 'None'}
            </span>
          </div>
        </div>

        {/* Right: Quick Actions & Preset Selector */}
        <div className="flex items-center gap-2">
          {/* Quick Tour Button */}
          <button
            onClick={startTour}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-500 hover:bg-amber-400 text-surface-950 transition-colors shadow-sm"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>2-Min Demo Tour</span>
          </button>

          {/* Preset Selector */}
          <div className="relative group">
            <button className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-surface-900 text-warm-200 hover:bg-surface-850 border border-surface-750 hover:text-white transition-colors">
              <GitFork className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Presets</span>
            </button>
            <div className="absolute right-0 mt-1 w-52 py-1.5 bg-surface-900 rounded-xl border border-surface-700 shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all z-50">
              <div className="px-3 py-1 text-[10px] font-semibold text-warm-400 uppercase tracking-wider">
                Select Tree Preset
              </div>
              <button
                onClick={() => loadPreset('dao')}
                className="w-full text-left px-3 py-2 text-xs text-warm-100 hover:bg-surface-800 flex items-center justify-between"
              >
                <span>🌐 Global Web3 DAO</span>
                <span className="text-[10px] text-warm-500">Default</span>
              </button>
              <button
                onClick={() => loadPreset('enterprise')}
                className="w-full text-left px-3 py-2 text-xs text-warm-100 hover:bg-surface-800 flex items-center justify-between"
              >
                <span>🏢 Enterprise FinTech</span>
              </button>
              <button
                onClick={() => loadPreset('blank')}
                className="w-full text-left px-3 py-2 text-xs text-warm-100 hover:bg-surface-800 flex items-center justify-between"
              >
                <span>🌱 Blank Root Tree</span>
              </button>
            </div>
          </div>

          {/* Reset Button */}
          <button
            onClick={() => loadPreset('dao')}
            title="Reset Tree to Default"
            className="p-1.5 text-warm-400 hover:text-warm-100 bg-surface-900 hover:bg-surface-850 rounded-lg border border-surface-750 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

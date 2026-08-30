'use client';

import React from 'react';
import { useGarden } from '../context/GardenContext';
import {
  TreePine,
  Sparkles,
  ShieldCheck,
  Zap,
  Scissors,
  ChevronRight,
  ChevronLeft,
  X,
  CheckCircle2,
  Lock,
  Layers
} from 'lucide-react';

export const InteractiveTour: React.FC = () => {
  const { isTourActive, tourStep, nextTourStep, prevTourStep, endTour, setActivePersona, selectNode, tree } = useGarden();

  if (!isTourActive) return null;

  const steps = [
    {
      title: 'Welcome to KeyGarden',
      badge: 'Hackathon Overview',
      icon: <TreePine className="w-6 h-6 text-garden-400" />,
      content:
        'KeyGarden brings Hierarchical Account Trees to Ethereum organizations. A root smart account issues departmental sub-accounts, which issue team leads and ephemeral bots — each inheriting and strictly narrowing the policy above it.',
      actionLabel: 'Explore Account Hierarchy →',
      onEnter: () => {
        selectNode(tree.nodeId);
      }
    },
    {
      title: '1. Hierarchical Account Tree & Lineage',
      badge: 'Visual Hierarchy',
      icon: <Layers className="w-6 h-6 text-blue-400" />,
      content:
        'Inspect the visual tree: Level 0 is the Executive DAO Treasury. Level 1 are Department Admins (Operations, Marketing). Level 2 are Team Leads, and Level 3 are Ephemeral Bots. Every node has an authorized signer EOA and an onchain policy.',
      actionLabel: 'Inspect Policy Narrowing →',
      onEnter: () => {
        if (tree.children && tree.children[1]) {
          selectNode(tree.children[1].nodeId);
        }
      }
    },
    {
      title: '2. Policy Narrowing Invariant',
      badge: 'Cryptographic Security',
      icon: <ShieldCheck className="w-6 h-6 text-purple-400" />,
      content:
        'A fundamental invariant of KeyGarden: child policies can NEVER exceed their parent! A child cannot ask for a higher budget, broader target contracts, or longer validity than its parent. Violations are rejected at registration and execution.',
      actionLabel: 'Test Live ERC-4337 Execution →',
      onEnter: () => {
        const botId = '0xbot000000000000000000000000000000000000000000000000000000000007';
        selectNode(botId);
        setActivePersona(botId);
      }
    },
    {
      title: '3. ERC-4337 Sponsored Execution',
      badge: 'Paymaster & Bundler',
      icon: <Zap className="w-6 h-6 text-amber-400" />,
      content:
        'Acting as the automated Farcaster Ad Bot (L3), the bot signs a UserOperation to broadcast a campaign. The Smart Account validates the ancestor lineage to Root, and the KeyGarden Paymaster sponsors 100% of the gas cost.',
      actionLabel: 'Witness Cascading Revocation →',
      onEnter: () => {}
    },
    {
      title: '4. Atomic Cascading Branch Pruning',
      badge: 'Core Innovation',
      icon: <Scissors className="w-6 h-6 text-red-400" />,
      content:
        'The killer feature: Revoking the Marketing Department in 1 single transaction atomically and cryptographically revokes EVERY child lead and bot under it! Lineage checks instantly block any further transactions without needing N separate revocation txs.',
      actionLabel: 'Finish Tour & Free Play →',
      onEnter: () => {}
    },
    {
      title: 'Ready for Demo & Presentation!',
      badge: 'Complete Prototype',
      icon: <CheckCircle2 className="w-6 h-6 text-garden-400" />,
      content:
        'You are now ready to freely interact with KeyGarden. Issue new sub-accounts, prune branches, and test sponsored ERC-4337 UserOperations. Check README.md, ARCHITECTURE.md, and DEMO.md for full presentation scripts!',
      actionLabel: 'Start Playing with KeyGarden',
      onEnter: () => {}
    }
  ];

  const current = steps[tourStep] || steps[0];
  const isLast = tourStep === steps.length - 1;

  const handleNext = () => {
    if (isLast) {
      endTour();
    } else {
      const nextIdx = tourStep + 1;
      nextTourStep();
      const nextStep = steps[nextIdx];
      if (nextStep) {
        nextStep.onEnter();
      }
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-full animate-slide-up">
      <div className="bg-dark-850 border-2 border-garden-500/80 rounded-2xl p-5 shadow-2xl ring-4 ring-garden-500/20 relative">
        {/* Close */}
        <button
          onClick={endTour}
          className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg hover:bg-dark-750"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-garden-500/10 text-garden-400 border border-garden-500/20">
            {current.badge}
          </span>
          <span className="text-xs text-gray-500 font-mono">
            Step {tourStep + 1} of {steps.length}
          </span>
        </div>

        {/* Title */}
        <div className="flex items-center gap-2.5 mb-2">
          {current.icon}
          <h3 className="text-base font-bold text-white">{current.title}</h3>
        </div>

        {/* Content */}
        <p className="text-xs text-gray-300 leading-relaxed mb-4">
          {current.content}
        </p>

        {/* Controls */}
        <div className="flex items-center justify-between pt-2 border-t border-dark-750">
          <button
            onClick={prevTourStep}
            disabled={tourStep === 0}
            className={"p-2 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors " +
              (tourStep === 0 ? "opacity-30 cursor-not-allowed text-gray-600" : "text-gray-400 hover:text-white hover:bg-dark-800")}
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>

          <button
            onClick={handleNext}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-garden-600 to-garden-500 hover:from-garden-500 hover:to-garden-400 flex items-center gap-1.5 shadow-md shadow-garden-600/20"
          >
            <span>{current.actionLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

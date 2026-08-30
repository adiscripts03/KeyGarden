'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { GardenNode, ExecutionLog, Policy } from '../types/garden';
import { INITIAL_DAO_TREE, ROOT_SMART_ACCOUNT } from '../lib/constants';
import {
  findNodeById,
  getAllNodes,
  addSubAccountToTree,
  revokeSubtreeInTree,
  executeUserOperation,
  countTreeStats
} from '../lib/garden-engine';
import confetti from 'canvas-confetti';

interface GardenContextType {
  tree: GardenNode;
  selectedNodeId: string | null;
  selectedNode: GardenNode | null;
  activePersonaId: string;
  activePersonaNode: GardenNode | null;
  executionLogs: ExecutionLog[];
  isExecuting: boolean;
  stats: {
    totalNodes: number;
    activeNodes: number;
    revokedNodes: number;
    totalBudgetEth: number;
    totalSpentEth: number;
  };
  isTourActive: boolean;
  tourStep: number;
  selectNode: (nodeId: string | null) => void;
  setActivePersona: (nodeId: string) => void;
  createSubAccount: (
    parentNodeId: string,
    data: {
      label: string;
      role: GardenNode['role'];
      signerAddress: string;
      signerPrivateKey?: string;
      policy: Policy;
    }
  ) => Promise<{ success: boolean; newNodeId?: string; error?: string }>;
  revokeBranch: (nodeId: string, reason: string) => Promise<{ success: boolean; count: number }>;
  executeAction: (
    nodeId: string,
    targetAddress: string,
    selector: string,
    valueEth: string,
    argsSummary: string
  ) => Promise<{ success: boolean; log: ExecutionLog }>;
  loadPreset: (preset: 'dao' | 'enterprise' | 'blank') => void;
  clearLogs: () => void;
  startTour: () => void;
  nextTourStep: () => void;
  prevTourStep: () => void;
  endTour: () => void;
}

const GardenContext = createContext<GardenContextType | undefined>(undefined);

export const GardenProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tree, setTree] = useState<GardenNode>(INITIAL_DAO_TREE);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(INITIAL_DAO_TREE.nodeId);
  const [activePersonaId, setActivePersonaId] = useState<string>(
    '0xbot000000000000000000000000000000000000000000000000000000000007'
  );
  const [executionLogs, setExecutionLogs] = useState<ExecutionLog[]>([]);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [isTourActive, setIsTourActive] = useState<boolean>(false);
  const [tourStep, setTourStep] = useState<number>(0);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('keygarden_tree_v1');
      if (saved) {
        setTree(JSON.parse(saved));
      }
    } catch (e) {}
  }, []);

  const saveTreeState = (newTree: GardenNode) => {
    setTree(newTree);
    try {
      localStorage.setItem('keygarden_tree_v1', JSON.stringify(newTree));
    } catch (e) {}
  };

  const selectedNode = selectedNodeId ? findNodeById(tree, selectedNodeId) : null;
  const activePersonaNode = findNodeById(tree, activePersonaId);
  const stats = countTreeStats(tree);

  const selectNode = useCallback((nodeId: string | null) => {
    setSelectedNodeId(nodeId);
  }, []);

  const setActivePersona = useCallback((nodeId: string) => {
    setActivePersonaId(nodeId);
  }, []);

  const createSubAccount = async (
    parentNodeId: string,
    data: {
      label: string;
      role: GardenNode['role'];
      signerAddress: string;
      signerPrivateKey?: string;
      policy: Policy;
    }
  ) => {
    try {
      const { updatedTree, newNodeId } = addSubAccountToTree(tree, parentNodeId, data);
      saveTreeState(updatedTree);
      setSelectedNodeId(newNodeId);
      setActivePersonaId(newNodeId);

      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 }
        });
      } catch (err) {}

      return { success: true, newNodeId };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to create sub-account' };
    }
  };

  const revokeBranch = async (nodeId: string, reason: string) => {
    const { updatedTree, revokedCount } = revokeSubtreeInTree(tree, nodeId, reason);
    saveTreeState(updatedTree);
    return { success: true, count: revokedCount };
  };

  const executeAction = async (
    nodeId: string,
    targetAddress: string,
    selector: string,
    valueEth: string,
    argsSummary: string
  ) => {
    setIsExecuting(true);
    try {
      await new Promise((r) => setTimeout(r, 450));

      const { success, log, updatedTree } = await executeUserOperation(
        tree,
        nodeId,
        targetAddress,
        selector,
        valueEth,
        argsSummary
      );

      if (success) {
        saveTreeState(updatedTree);
        try {
          confetti({
            particleCount: 30,
            spread: 40,
            origin: { y: 0.8 }
          });
        } catch (e) {}
      }

      setExecutionLogs((prev) => [log, ...prev]);
      return { success, log };
    } finally {
      setIsExecuting(false);
    }
  };

  const loadPreset = (preset: 'dao' | 'enterprise' | 'blank') => {
    if (preset === 'dao') {
      saveTreeState(INITIAL_DAO_TREE);
      setSelectedNodeId(INITIAL_DAO_TREE.nodeId);
      setActivePersonaId('0xbot000000000000000000000000000000000000000000000000000000000007');
    } else if (preset === 'enterprise') {
      const now = Math.floor(Date.now() / 1000);
      const enterpriseTree: GardenNode = {
        nodeId: '0xent_root_001',
        parentNodeId: null,
        label: 'Global Enterprise Treasury (CFO)',
        role: 'Root Treasury',
        signerAddress: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
        smartAccount: ROOT_SMART_ACCOUNT,
        isRevoked: false,
        depth: 0,
        createdAt: now - 86400 * 30,
        policy: {
          maxSpendPerTx: '25.0',
          totalBudget: '100.0',
          spentAmount: '12.0',
          validAfter: now - 86400 * 30,
          validUntil: now + 86400 * 365,
          allowedTargets: [],
          allowedSelectors: []
        },
        children: [
          {
            nodeId: '0xent_emea_002',
            parentNodeId: '0xent_root_001',
            label: 'EMEA Regional Division',
            role: 'Department Admin',
            signerAddress: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
            smartAccount: ROOT_SMART_ACCOUNT,
            isRevoked: false,
            depth: 1,
            createdAt: now - 86400 * 20,
            policy: {
              maxSpendPerTx: '5.0',
              totalBudget: '30.0',
              spentAmount: '4.5',
              validAfter: now - 86400 * 20,
              validUntil: now + 86400 * 180,
              allowedTargets: ['0x82D0704E9C1C97A19fE9447e1AcbEFbEb0b12C9a'],
              allowedSelectors: ['0x386d38e2']
            },
            children: [
              {
                nodeId: '0xent_london_004',
                parentNodeId: '0xent_emea_002',
                label: 'London HQ Payroll Lead',
                role: 'Team Lead',
                signerAddress: '0x9965507D1a55bcC2695C58ba16FB37d819B0A4df',
                smartAccount: ROOT_SMART_ACCOUNT,
                isRevoked: false,
                depth: 2,
                createdAt: now - 86400 * 10,
                policy: {
                  maxSpendPerTx: '1.0',
                  totalBudget: '8.0',
                  spentAmount: '1.0',
                  validAfter: now - 86400 * 10,
                  validUntil: now + 86400 * 60,
                  allowedTargets: ['0x82D0704E9C1C97A19fE9447e1AcbEFbEb0b12C9a'],
                  allowedSelectors: ['0x386d38e2']
                },
                children: []
              }
            ]
          }
        ]
      };
      saveTreeState(enterpriseTree);
      setSelectedNodeId(enterpriseTree.nodeId);
      setActivePersonaId('0xent_london_004');
    } else {
      const now = Math.floor(Date.now() / 1000);
      const blankTree: GardenNode = {
        nodeId: '0xblank_root_001',
        parentNodeId: null,
        label: 'New Master Smart Treasury',
        role: 'Root Treasury',
        signerAddress: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
        smartAccount: ROOT_SMART_ACCOUNT,
        isRevoked: false,
        depth: 0,
        createdAt: now,
        policy: {
          maxSpendPerTx: '10.0',
          totalBudget: '50.0',
          spentAmount: '0.0',
          validAfter: now,
          validUntil: now + 86400 * 365,
          allowedTargets: [],
          allowedSelectors: []
        },
        children: []
      };
      saveTreeState(blankTree);
      setSelectedNodeId(blankTree.nodeId);
      setActivePersonaId(blankTree.nodeId);
    }
  };

  const clearLogs = () => setExecutionLogs([]);
  const startTour = () => {
    setIsTourActive(true);
    setTourStep(0);
  };
  const nextTourStep = () => setTourStep((s) => s + 1);
  const prevTourStep = () => setTourStep((s) => Math.max(0, s - 1));
  const endTour = () => setIsTourActive(false);

  return (
    <GardenContext.Provider
      value={{
        tree,
        selectedNodeId,
        selectedNode,
        activePersonaId,
        activePersonaNode,
        executionLogs,
        isExecuting,
        stats,
        isTourActive,
        tourStep,
        selectNode,
        setActivePersona,
        createSubAccount,
        revokeBranch,
        executeAction,
        loadPreset,
        clearLogs,
        startTour,
        nextTourStep,
        prevTourStep,
        endTour
      }}
    >
      {children}
    </GardenContext.Provider>
  );
};

export const useGarden = () => {
  const context = useContext(GardenContext);
  if (!context) {
    throw new Error('useGarden must be used within a GardenProvider');
  }
  return context;
};

import { TargetContract, GardenNode } from '../types/garden';

export const MOCK_TARGETS: TargetContract[] = [
  {
    address: '0x71C67Ed3855aa52170dBC2CE4D262F64aF21b793',
    name: 'Treasury Vault (Grants & Staking)',
    category: 'Treasury',
    description: 'Master treasury contract for core grant disbursements and protocol staking.',
    functions: [
      {
        selector: '0x12b591b6',
        signature: 'disburseGrant(address,uint256,string)',
        description: 'Disburse a research or ecosystem grant from the treasury',
        defaultArgs: { recipient: '0x9965507D1a55bcC2695C58ba16FB37d819B0A4df', amount: '0.5', memo: 'Devcon Builder Grant' }
      },
      {
        selector: '0xa694fc3a',
        signature: 'stakeTokens(uint256)',
        description: 'Stake treasury assets into validator security pool',
        defaultArgs: { amount: '1.0' }
      }
    ]
  },
  {
    address: '0x82D0704E9C1C97A19fE9447e1AcbEFbEb0b12C9a',
    name: 'Vendor & Payroll Gateway',
    category: 'Vendor',
    description: 'Contract for paying verified service provider invoices and contractor payroll.',
    functions: [
      {
        selector: '0x386d38e2',
        signature: 'payInvoice(uint256,uint256,string)',
        description: 'Settle verified vendor or contractor invoice with milestone verification',
        defaultArgs: { invoiceId: 4092, amount: '0.25', vendorName: 'AWS Cloud Hosting' }
      },
      {
        selector: '0x8b5b5463',
        signature: 'registerVendor(string)',
        description: 'Register a new verified vendor in organization registry',
        defaultArgs: { name: 'Figma Enterprise License' }
      }
    ]
  },
  {
    address: '0x93E46Fe2408c582531F33F23b7E78e0d4B78bA06',
    name: 'Marketing & Social Oracle',
    category: 'Marketing',
    description: 'Automated dispatcher for ad campaign budget allocations, hackathon prizes, and social promotions.',
    functions: [
      {
        selector: '0xc555c829',
        signature: 'broadcastCampaign(string,string,uint256)',
        description: 'Fund an active ad broadcast campaign on Web3 social platforms',
        defaultArgs: { channel: 'farcaster_bounty', contentHash: 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi', budgetUsed: '0.05' }
      }
    ]
  },
  {
    address: '0xA4F8aDb6144883444086603a1d9435b6F6045E7b',
    name: 'DeFi Liquidity Hub',
    category: 'DeFi',
    description: 'Protocol module for providing liquidity and rebalancing protocol reserves.',
    functions: [
      {
        selector: '0xe8e33700',
        signature: 'provideLiquidity(uint256)',
        description: 'Provide liquidity to ETH/USDC automated market maker pool',
        defaultArgs: { amount: '0.5' }
      }
    ]
  }
];

export const ROOT_SMART_ACCOUNT = '0x1010AAcc95204218C5eC3193E37b35069B569D1E';
export const REGISTRY_CONTRACT_ADDRESS = '0x2020Reg771C497B1A5Da74F0321F5a11F68731b9';
export const PAYMASTER_CONTRACT_ADDRESS = '0x3030Pay916Ce1bDb503C35029D8b7b20468E7E0a';

const now = Math.floor(Date.now() / 1000);
const ONE_DAY = 86400;

export const INITIAL_DAO_TREE: GardenNode = {
  nodeId: '0xroot000000000000000000000000000000000000000000000000000000000001',
  parentNodeId: null,
  label: 'Executive DAO Treasury',
  role: 'Root Treasury',
  signerAddress: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
  signerPrivateKey: '0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d',
  smartAccount: ROOT_SMART_ACCOUNT,
  isRevoked: false,
  depth: 0,
  createdAt: now - ONE_DAY * 10,
  policy: {
    maxSpendPerTx: '10.0',
    totalBudget: '50.0',
    spentAmount: '3.4',
    validAfter: now - ONE_DAY * 10,
    validUntil: now + ONE_DAY * 365,
    allowedTargets: [], // All targets permitted
    allowedSelectors: [] // All selectors permitted
  },
  children: [
    {
      nodeId: '0xdept000000000000000000000000000000000000000000000000000000000002',
      parentNodeId: '0xroot000000000000000000000000000000000000000000000000000000000001',
      label: 'Operations & Payroll Dept',
      role: 'Department Admin',
      signerAddress: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
      signerPrivateKey: '0x6cbed15c793ce57650b9877cf26f5d7d95770ee7b50077f4f18f2f0083273561',
      smartAccount: ROOT_SMART_ACCOUNT,
      isRevoked: false,
      depth: 1,
      createdAt: now - ONE_DAY * 8,
      policy: {
        maxSpendPerTx: '2.5',
        totalBudget: '15.0',
        spentAmount: '1.25',
        validAfter: now - ONE_DAY * 8,
        validUntil: now + ONE_DAY * 90,
        allowedTargets: [
          '0x82D0704E9C1C97A19fE9447e1AcbEFbEb0b12C9a', // Vendor Gateway
          '0x71C67Ed3855aa52170dBC2CE4D262F64aF21b793'  // Treasury Vault
        ],
        allowedSelectors: [
          '0x386d38e2', // payInvoice
          '0x8b5b5463', // registerVendor
          '0x12b591b6'  // disburseGrant
        ]
      },
      children: [
        {
          nodeId: '0xteam000000000000000000000000000000000000000000000000000000000004',
          parentNodeId: '0xdept000000000000000000000000000000000000000000000000000000000002',
          label: 'Senior Payroll Manager',
          role: 'Team Lead',
          signerAddress: '0x9965507D1a55bcC2695C58ba16FB37d819B0A4df',
          signerPrivateKey: '0x6370fd033278c143033d34f77426b360470f3914d804f762777530295f45f33a',
          smartAccount: ROOT_SMART_ACCOUNT,
          isRevoked: false,
          depth: 2,
          createdAt: now - ONE_DAY * 6,
          policy: {
            maxSpendPerTx: '1.0',
            totalBudget: '6.0',
            spentAmount: '0.8',
            validAfter: now - ONE_DAY * 6,
            validUntil: now + ONE_DAY * 30,
            allowedTargets: [
              '0x82D0704E9C1C97A19fE9447e1AcbEFbEb0b12C9a' // Vendor Gateway only
            ],
            allowedSelectors: [
              '0x386d38e2' // payInvoice only
            ]
          },
          children: [
            {
              nodeId: '0xbot000000000000000000000000000000000000000000000000000000000006',
              parentNodeId: '0xteam000000000000000000000000000000000000000000000000000000000004',
              label: 'Cloud Invoice Settlement Bot',
              role: 'Ephemeral Bot',
              signerAddress: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
              signerPrivateKey: '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
              smartAccount: ROOT_SMART_ACCOUNT,
              isRevoked: false,
              depth: 3,
              createdAt: now - ONE_DAY * 2,
              policy: {
                maxSpendPerTx: '0.3',
                totalBudget: '1.5',
                spentAmount: '0.25',
                validAfter: now - ONE_DAY * 2,
                validUntil: now + ONE_DAY * 7,
                allowedTargets: [
                  '0x82D0704E9C1C97A19fE9447e1AcbEFbEb0b12C9a'
                ],
                allowedSelectors: [
                  '0x386d38e2'
                ]
              },
              children: []
            }
          ]
        }
      ]
    },
    {
      nodeId: '0xdept000000000000000000000000000000000000000000000000000000000003',
      parentNodeId: '0xroot000000000000000000000000000000000000000000000000000000000001',
      label: 'Growth & Marketing Dept',
      role: 'Department Admin',
      signerAddress: '0x976EA74026E726554dB657fA54763abd0C3a0aa9',
      signerPrivateKey: '0x92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d6b8d88b2b4ec1564e',
      smartAccount: ROOT_SMART_ACCOUNT,
      isRevoked: false,
      depth: 1,
      createdAt: now - ONE_DAY * 7,
      policy: {
        maxSpendPerTx: '1.5',
        totalBudget: '10.0',
        spentAmount: '1.8',
        validAfter: now - ONE_DAY * 7,
        validUntil: now + ONE_DAY * 60,
        allowedTargets: [
          '0x93E46Fe2408c582531F33F23b7E78e0d4B78bA06', // Marketing & Social
          '0x71C67Ed3855aa52170dBC2CE4D262F64aF21b793'  // Treasury Vault
        ],
        allowedSelectors: [
          '0xc555c829', // broadcastCampaign
          '0x12b591b6'  // disburseGrant
        ]
      },
      children: [
        {
          nodeId: '0xteam000000000000000000000000000000000000000000000000000000000005',
          parentNodeId: '0xdept000000000000000000000000000000000000000000000000000000000003',
          label: 'Campaign Lead',
          role: 'Team Lead',
          signerAddress: '0x14dC79964da2C08b23698B3D3cc7Ca32193d9955',
          signerPrivateKey: '0x4bbbf85ce3377467afe5d46f804f221813b2bb87f24d81f60f1fcdbf7cbf4356',
          smartAccount: ROOT_SMART_ACCOUNT,
          isRevoked: false,
          depth: 2,
          createdAt: now - ONE_DAY * 5,
          policy: {
            maxSpendPerTx: '0.5',
            totalBudget: '3.0',
            spentAmount: '0.45',
            validAfter: now - ONE_DAY * 5,
            validUntil: now + ONE_DAY * 21,
            allowedTargets: [
              '0x93E46Fe2408c582531F33F23b7E78e0d4B78bA06'
            ],
            allowedSelectors: [
              '0xc555c829'
            ]
          },
          children: [
            {
              nodeId: '0xbot000000000000000000000000000000000000000000000000000000000007',
              parentNodeId: '0xteam000000000000000000000000000000000000000000000000000000000005',
              label: 'Automated Farcaster Ad Bot',
              role: 'Ephemeral Bot',
              signerAddress: '0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f',
              signerPrivateKey: '0xdbda1821b80551c9d65939329250298aa3472ba22feea921c0cf5d620ea67b97',
              smartAccount: ROOT_SMART_ACCOUNT,
              isRevoked: false,
              depth: 3,
              createdAt: now - ONE_DAY * 1,
              policy: {
                maxSpendPerTx: '0.1',
                totalBudget: '0.5',
                spentAmount: '0.05',
                validAfter: now - ONE_DAY * 1,
                validUntil: now + ONE_DAY * 3,
                allowedTargets: [
                  '0x93E46Fe2408c582531F33F23b7E78e0d4B78bA06'
                ],
                allowedSelectors: [
                  '0xc555c829'
                ]
              },
              children: []
            }
          ]
        }
      ]
    }
  ]
};

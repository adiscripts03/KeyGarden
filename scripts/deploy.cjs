const hre = require("hardhat");

async function main() {
  const { ethers } = hre;
  console.log("=================================================");
  console.log("   KeyGarden: Hierarchical Account Abstraction   ");
  console.log("      Road to Devcon - IIITN Edition Deploy      ");
  console.log("=================================================\n");

  const [deployer] = await ethers.getSigners();
  console.log(`Deploying with account: ${deployer.address}`);
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Account balance: ${ethers.formatEther(balance)} ETH\n`);

  // 1. Deploy HierarchicalPolicyRegistry
  console.log("[1/5] Deploying HierarchicalPolicyRegistry...");
  const RegistryFactory = await ethers.getContractFactory("HierarchicalPolicyRegistry");
  const registry = await RegistryFactory.deploy();
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log(`✓ HierarchicalPolicyRegistry deployed at: ${registryAddress}`);

  // 2. Deploy Mock Target Services (Vault, Vendor, Social)
  console.log("\n[2/5] Deploying Mock Target Services...");
  const TreasuryFactory = await ethers.getContractFactory("MockTreasuryVault");
  const treasury = await TreasuryFactory.deploy();
  await treasury.waitForDeployment();
  const treasuryAddress = await treasury.getAddress();
  console.log(`✓ MockTreasuryVault deployed at: ${treasuryAddress}`);

  const VendorFactory = await ethers.getContractFactory("MockVendorContract");
  const vendor = await VendorFactory.deploy();
  await vendor.waitForDeployment();
  const vendorAddress = await vendor.getAddress();
  console.log(`✓ MockVendorContract deployed at: ${vendorAddress}`);

  const SocialFactory = await ethers.getContractFactory("MockSocialCampaign");
  const social = await SocialFactory.deploy();
  await social.waitForDeployment();
  const socialAddress = await social.getAddress();
  console.log(`✓ MockSocialCampaign deployed at: ${socialAddress}`);

  // 3. Deploy KeyGardenAccount (ERC-4337 Smart Account)
  console.log("\n[3/5] Deploying KeyGardenAccount (ERC-4337 Smart Account)...");
  const AccountFactory = await ethers.getContractFactory("KeyGardenAccount");
  const smartAccount = await AccountFactory.deploy(deployer.address, registryAddress, {
    value: ethers.parseEther("0.1")
  });
  await smartAccount.waitForDeployment();
  const smartAccountAddress = await smartAccount.getAddress();
  console.log(`✓ KeyGardenAccount deployed at: ${smartAccountAddress}`);

  // 4. Deploy KeyGardenPaymaster (ERC-4337 Gas Sponsor)
  console.log("\n[4/5] Deploying KeyGardenPaymaster...");
  const PaymasterFactory = await ethers.getContractFactory("KeyGardenPaymaster");
  const paymaster = await PaymasterFactory.deploy(registryAddress, {
    value: ethers.parseEther("0.1")
  });
  await paymaster.waitForDeployment();
  const paymasterAddress = await paymaster.getAddress();
  console.log(`✓ KeyGardenPaymaster deployed at: ${paymasterAddress}`);

  // 5. Initialize Root Node in Registry
  console.log("\n[5/5] Initializing Root Treasury in Hierarchy Registry...");
  const currentBlock = await ethers.provider.getBlock("latest");
  const now = currentBlock ? currentBlock.timestamp : Math.floor(Date.now() / 1000);

  const rootPolicy = {
    maxSpendPerTx: ethers.parseEther("5.0"),
    totalBudget: ethers.parseEther("10.0"),
    spentAmount: 0,
    validAfter: now,
    validUntil: now + 86400 * 365, // 1 year
    allowedTargets: [], // All targets allowed
    allowedSelectors: [], // All selectors allowed
  };

  const txRoot = await registry.registerRoot(
    smartAccountAddress,
    deployer.address,
    "Executive Root Treasury",
    rootPolicy
  );
  const receipt = await txRoot.wait();
  console.log(`✓ Root Account registered in transaction: ${receipt.hash}`);

  console.log("\n=================================================");
  console.log("           DEPLOYMENT SUMMARY JSON               ");
  console.log("=================================================");
  const deploymentInfo = {
    network: hre.network.name,
    chainId: (await ethers.provider.getNetwork()).chainId.toString(),
    deployer: deployer.address,
    contracts: {
      HierarchicalPolicyRegistry: registryAddress,
      KeyGardenAccount: smartAccountAddress,
      KeyGardenPaymaster: paymasterAddress,
      MockTreasuryVault: treasuryAddress,
      MockVendorContract: vendorAddress,
      MockSocialCampaign: socialAddress,
    },
    deployedAt: new Date().toISOString(),
  };

  console.log(JSON.stringify(deploymentInfo, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("KeyGarden Hierarchical Policy Tree & Smart Account", function () {
  let registry, smartAccount, paymaster, treasury, vendor, social;
  let owner, rootSigner, marketingSigner, growthSigner, adBotSigner, engineeringSigner, devopsSigner, attacker;

  let rootNodeId, marketingNodeId, growthNodeId, adBotNodeId, engineeringNodeId;

  beforeEach(async function () {
    [owner, rootSigner, marketingSigner, growthSigner, adBotSigner, engineeringSigner, devopsSigner, attacker] =
      await ethers.getSigners();

    // Deploy Registry
    const RegistryFactory = await ethers.getContractFactory("HierarchicalPolicyRegistry");
    registry = await RegistryFactory.deploy();

    // Deploy Targets
    const TreasuryFactory = await ethers.getContractFactory("MockTreasuryVault");
    treasury = await TreasuryFactory.deploy();

    const VendorFactory = await ethers.getContractFactory("MockVendorContract");
    vendor = await VendorFactory.deploy();

    const SocialFactory = await ethers.getContractFactory("MockSocialCampaign");
    social = await SocialFactory.deploy();

    // Deploy Smart Account
    const AccountFactory = await ethers.getContractFactory("KeyGardenAccount");
    smartAccount = await AccountFactory.deploy(owner.address, await registry.getAddress());

    // Deploy Paymaster
    const PaymasterFactory = await ethers.getContractFactory("KeyGardenPaymaster");
    paymaster = await PaymasterFactory.deploy(await registry.getAddress());

    // Fund smart account with 10 ETH
    await owner.sendTransaction({
      to: await smartAccount.getAddress(),
      value: ethers.parseEther("10.0"),
    });

    // 1. Register Root
    const currentTime = (await ethers.provider.getBlock("latest")).timestamp;
    const rootPolicy = {
      maxSpendPerTx: ethers.parseEther("5.0"),
      totalBudget: ethers.parseEther("10.0"),
      spentAmount: 0,
      validAfter: currentTime,
      validUntil: currentTime + 86400 * 365, // 1 year
      allowedTargets: [], // All targets allowed
      allowedSelectors: [], // All selectors allowed
    };

    const txRoot = await registry.registerRoot(
      await smartAccount.getAddress(),
      rootSigner.address,
      "Root Executive Treasury",
      rootPolicy
    );
    const receiptRoot = await txRoot.wait();
    const eventRoot = receiptRoot.logs.find(
      (l) => registry.interface.parseLog(l)?.name === "RootRegistered"
    );
    rootNodeId = registry.interface.parseLog(eventRoot).args.rootNodeId;
  });

  describe("1. Hierarchy Creation & Policy Narrowing", function () {
    it("should allow parent to issue departmental sub-account with narrower policy", async function () {
      const currentTime = (await ethers.provider.getBlock("latest")).timestamp;
      const marketingPolicy = {
        maxSpendPerTx: ethers.parseEther("1.0"),
        totalBudget: ethers.parseEther("4.0"),
        spentAmount: 0,
        validAfter: currentTime,
        validUntil: currentTime + 86400 * 30, // 30 days
        allowedTargets: [await vendor.getAddress(), await social.getAddress()],
        allowedSelectors: [],
      };

      const txDept = await registry
        .connect(rootSigner)
        .registerSubAccount(
          rootNodeId,
          marketingSigner.address,
          "Marketing Department",
          "Department Admin",
          marketingPolicy
        );
      const receiptDept = await txDept.wait();
      const event = receiptDept.logs.find(
        (l) => registry.interface.parseLog(l)?.name === "SubAccountRegistered"
      );
      marketingNodeId = registry.interface.parseLog(event).args.nodeId;

      expect(marketingNodeId).to.not.be.null;
      const node = await registry.nodes(marketingNodeId);
      expect(node.label).to.equal("Marketing Department");
      expect(node.policy.totalBudget).to.equal(ethers.parseEther("4.0"));
    });

    it("should reject sub-account if child budget exceeds parent budget (Policy Narrowing)", async function () {
      const currentTime = (await ethers.provider.getBlock("latest")).timestamp;
      const excessivePolicy = {
        maxSpendPerTx: ethers.parseEther("1.0"),
        totalBudget: ethers.parseEther("15.0"), // Root only has 10.0 ETH!
        spentAmount: 0,
        validAfter: currentTime,
        validUntil: currentTime + 86400 * 30,
        allowedTargets: [],
        allowedSelectors: [],
      };

      await expect(
        registry
          .connect(rootSigner)
          .registerSubAccount(
            rootNodeId,
            marketingSigner.address,
            "Greedy Dept",
            "Admin",
            excessivePolicy
          )
      ).to.be.revertedWithCustomError(registry, "NarrowingViolation");
    });

    it("should reject sub-account if child targets exceed parent allowed targets", async function () {
      const currentTime = (await ethers.provider.getBlock("latest")).timestamp;
      // Setup Marketing with whitelist [vendor]
      const marketingPolicy = {
        maxSpendPerTx: ethers.parseEther("1.0"),
        totalBudget: ethers.parseEther("2.0"),
        spentAmount: 0,
        validAfter: currentTime,
        validUntil: currentTime + 86400 * 30,
        allowedTargets: [await vendor.getAddress()],
        allowedSelectors: [],
      };

      const txDept = await registry
        .connect(rootSigner)
        .registerSubAccount(
          rootNodeId,
          marketingSigner.address,
          "Marketing Department",
          "Department Admin",
          marketingPolicy
        );
      const receipt = await txDept.wait();
      const event = receipt.logs.find(
        (l) => registry.interface.parseLog(l)?.name === "SubAccountRegistered"
      );
      marketingNodeId = registry.interface.parseLog(event).args.nodeId;

      // Now Marketing tries to issue Growth Lead with unapproved target [treasury]
      const illegalChildPolicy = {
        maxSpendPerTx: ethers.parseEther("0.5"),
        totalBudget: ethers.parseEther("1.0"),
        spentAmount: 0,
        validAfter: currentTime,
        validUntil: currentTime + 86400 * 10,
        allowedTargets: [await treasury.getAddress()], // NOT permitted by parent!
        allowedSelectors: [],
      };

      await expect(
        registry
          .connect(marketingSigner)
          .registerSubAccount(
            marketingNodeId,
            growthSigner.address,
            "Growth Lead",
            "Team Lead",
            illegalChildPolicy
          )
      ).to.be.revertedWithCustomError(registry, "NarrowingViolation");
    });
  });

  describe("2. Execution & Cascading Revocation (Branch Pruning)", function () {
    beforeEach(async function () {
      const currentTime = (await ethers.provider.getBlock("latest")).timestamp;

      // 1. Marketing Department (Level 1)
      const marketingPolicy = {
        maxSpendPerTx: ethers.parseEther("2.0"),
        totalBudget: ethers.parseEther("5.0"),
        spentAmount: 0,
        validAfter: currentTime,
        validUntil: currentTime + 86400 * 30,
        allowedTargets: [await vendor.getAddress(), await social.getAddress()],
        allowedSelectors: [],
      };
      let tx = await registry
        .connect(rootSigner)
        .registerSubAccount(
          rootNodeId,
          marketingSigner.address,
          "Marketing Department",
          "Department Admin",
          marketingPolicy
        );
      let receipt = await tx.wait();
      marketingNodeId = registry.interface.parseLog(
        receipt.logs.find((l) => registry.interface.parseLog(l)?.name === "SubAccountRegistered")
      ).args.nodeId;

      // 2. Growth Lead (Level 2 under Marketing)
      const growthPolicy = {
        maxSpendPerTx: ethers.parseEther("1.0"),
        totalBudget: ethers.parseEther("2.0"),
        spentAmount: 0,
        validAfter: currentTime,
        validUntil: currentTime + 86400 * 14,
        allowedTargets: [await vendor.getAddress(), await social.getAddress()],
        allowedSelectors: [],
      };
      tx = await registry
        .connect(marketingSigner)
        .registerSubAccount(
          marketingNodeId,
          growthSigner.address,
          "Growth Lead",
          "Team Lead",
          growthPolicy
        );
      receipt = await tx.wait();
      growthNodeId = registry.interface.parseLog(
        receipt.logs.find((l) => registry.interface.parseLog(l)?.name === "SubAccountRegistered")
      ).args.nodeId;

      // 3. Ad Bot (Level 3 under Growth Lead)
      const adBotPolicy = {
        maxSpendPerTx: ethers.parseEther("0.1"),
        totalBudget: ethers.parseEther("0.5"),
        spentAmount: 0,
        validAfter: currentTime,
        validUntil: currentTime + 86400 * 2,
        allowedTargets: [await social.getAddress()],
        allowedSelectors: [],
      };
      tx = await registry
        .connect(growthSigner)
        .registerSubAccount(
          growthNodeId,
          adBotSigner.address,
          "Social Ad Bot",
          "Automated Bot",
          adBotPolicy
        );
      receipt = await tx.wait();
      adBotNodeId = registry.interface.parseLog(
        receipt.logs.find((l) => registry.interface.parseLog(l)?.name === "SubAccountRegistered")
      ).args.nodeId;

      // 4. Engineering Department (Separate Level 1 branch)
      const engPolicy = {
        maxSpendPerTx: ethers.parseEther("3.0"),
        totalBudget: ethers.parseEther("4.0"),
        spentAmount: 0,
        validAfter: currentTime,
        validUntil: currentTime + 86400 * 60,
        allowedTargets: [await treasury.getAddress()],
        allowedSelectors: [],
      };
      tx = await registry
        .connect(rootSigner)
        .registerSubAccount(
          rootNodeId,
          engineeringSigner.address,
          "Engineering Department",
          "Department Admin",
          engPolicy
        );
      receipt = await tx.wait();
      engineeringNodeId = registry.interface.parseLog(
        receipt.logs.find((l) => registry.interface.parseLog(l)?.name === "SubAccountRegistered")
      ).args.nodeId;
    });

    it("should allow Ad Bot (Level 3) to execute valid call within its narrowed bounds", async function () {
      const socialData = social.interface.encodeFunctionData("broadcastCampaign", [
        "twitter",
        "QmHash12345",
        ethers.parseEther("0.05"),
      ]);

      const tx = await smartAccount
        .connect(adBotSigner)
        .executeFromSubAccount(adBotNodeId, await social.getAddress(), 0, socialData);
      const receipt = await tx.wait();

      expect(receipt.status).to.equal(1);

      // Verify node is still active
      expect(await registry.isNodeActive(adBotNodeId)).to.be.true;
    });

    it("should reject Ad Bot if calling a target allowed for Marketing but pruned for Ad Bot", async function () {
      const vendorData = vendor.interface.encodeFunctionData("payInvoice", [
        101,
        ethers.parseEther("0.05"),
        "Acme Corp",
      ]);

      // Vendor is allowed for Marketing and Growth, but AdBot only has social.getAddress()!
      await expect(
        smartAccount
          .connect(adBotSigner)
          .executeFromSubAccount(adBotNodeId, await vendor.getAddress(), 0, vendorData)
      ).to.be.revertedWithCustomError(registry, "TargetNotAllowed");
    });

    it("CASCADING REVOCATION: Revoking Marketing Department instantly revokes Growth Lead AND Ad Bot!", async function () {
      // Confirm all 3 nodes in the branch are initially active
      expect(await registry.isNodeActive(marketingNodeId)).to.be.true;
      expect(await registry.isNodeActive(growthNodeId)).to.be.true;
      expect(await registry.isNodeActive(adBotNodeId)).to.be.true;
      expect(await registry.isNodeActive(engineeringNodeId)).to.be.true;

      // Root revokes Marketing Department
      await registry
        .connect(rootSigner)
        .revokeSubtree(marketingNodeId, "Department restructured / rogue key detected");

      // Verify node active checks
      expect(await registry.isNodeActive(marketingNodeId)).to.be.false;
      expect(await registry.isNodeActive(growthNodeId)).to.be.false; // Cascading!
      expect(await registry.isNodeActive(adBotNodeId)).to.be.false; // Cascading!

      // Engineering branch MUST remain intact and active!
      expect(await registry.isNodeActive(engineeringNodeId)).to.be.true;

      // Attempting execution from Ad Bot must fail immediately with AncestorIsRevoked
      const socialData = social.interface.encodeFunctionData("broadcastCampaign", [
        "twitter",
        "QmHash12345",
        ethers.parseEther("0.05"),
      ]);

      await expect(
        smartAccount
          .connect(adBotSigner)
          .executeFromSubAccount(adBotNodeId, await social.getAddress(), 0, socialData)
      ).to.be.revertedWithCustomError(registry, "AncestorIsRevoked");

      // Paymaster also immediately rejects gas sponsorship for any revoked branch node!
      await expect(
        paymaster.sponsorSubAccountOp(
          adBotNodeId,
          await smartAccount.getAddress(),
          ethers.parseEther("0.001")
        )
      ).to.be.revertedWith("Paymaster: Sub-account branch is revoked or expired");
    });
  });
});

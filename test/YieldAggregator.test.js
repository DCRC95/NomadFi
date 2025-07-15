const { expect } = require("chai");
const { ethers } = require("hardhat");
const { getAddress } = require("ethers");

describe("DeFi Yield Aggregator MVP", function () {
  let owner, user1, user2;
  let mockERC20, mockYieldStrategy, yieldAggregator;

  beforeEach(async function () {
    // Get signers
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy MockERC20
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    mockERC20 = await MockERC20.deploy();

    // Deploy MockYieldStrategy
    const MockYieldStrategy = await ethers.getContractFactory("MockYieldStrategy");
    mockYieldStrategy = await MockYieldStrategy.deploy(mockERC20.target);

    // Deploy YieldAggregator
    const YieldAggregator = await ethers.getContractFactory("YieldAggregator");
    yieldAggregator = await YieldAggregator.deploy();
  });

  describe("MockERC20", function () {
    it("should have zero total supply initially", async function () {
      expect(await mockERC20.totalSupply()).to.equal(0n);
    });

    describe("after minting", function () {
      beforeEach(async function () {
        await mockERC20.connect(user1).mint(ethers.parseEther("1000"));
        await mockERC20.connect(user2).mint(ethers.parseEther("1000"));
      });

      it("should mint tokens to the caller and increase total supply", async function () {
        const amount = ethers.parseEther("100");
        const tx = await mockERC20.connect(user1).mint(amount);
        await expect(tx)
          .to.emit(mockERC20, "Transfer")
          .withArgs(ethers.ZeroAddress, user1.address, amount);
        expect(await mockERC20.balanceOf(user1.address)).to.equal(ethers.parseEther("1100"));
        expect(await mockERC20.totalSupply()).to.equal(ethers.parseEther("2100"));
      });

      it("should transfer tokens and emit Transfer event", async function () {
        const amount = ethers.parseEther("50");
        const tx = await mockERC20.connect(user1).transfer(user2.address, amount);
        await expect(tx)
          .to.emit(mockERC20, "Transfer")
          .withArgs(user1.address, user2.address, amount);
        expect(await mockERC20.balanceOf(user1.address)).to.equal(ethers.parseEther("950"));
        expect(await mockERC20.balanceOf(user2.address)).to.equal(ethers.parseEther("1050"));
      });

      it("should approve and transferFrom correctly, emitting Approval and Transfer events", async function () {
        const amount = ethers.parseEther("25");
        const approveTx = await mockERC20.connect(user1).approve(user2.address, amount);
        await expect(approveTx)
          .to.emit(mockERC20, "Approval")
          .withArgs(user1.address, user2.address, amount);
        expect(await mockERC20.allowance(user1.address, user2.address)).to.equal(amount);
        const transferFromTx = await mockERC20.connect(user2).transferFrom(user1.address, user2.address, amount);
        await expect(transferFromTx)
          .to.emit(mockERC20, "Transfer")
          .withArgs(user1.address, user2.address, amount);
        expect(await mockERC20.balanceOf(user1.address)).to.equal(ethers.parseEther("975"));
        expect(await mockERC20.balanceOf(user2.address)).to.equal(ethers.parseEther("1025"));
      });
    });
  });

  describe("MockYieldStrategy", function () {
    beforeEach(async function () {
      await mockERC20.connect(user1).mint(ethers.parseEther("1000"));
    });

    it("should be deployed with the correct mock token address", async function () {
      expect(await mockYieldStrategy.mockToken()).to.equal(mockERC20.target);
    });

    it("getAPY() should return the hardcoded value", async function () {
      expect(await mockYieldStrategy.getAPY()).to.equal(500n);
    });

    it("should allow deposit, update mapping, and emit Deposit event", async function () {
      const amount = ethers.parseEther("100");
      await mockERC20.connect(user1).approve(mockYieldStrategy.target, amount);
      const tx = await mockYieldStrategy.connect(user1).deposit(amount);
      await expect(tx)
        .to.emit(mockYieldStrategy, "Deposit")
        .withArgs(user1.address, amount);
      expect(await mockYieldStrategy.deposits(user1.address)).to.equal(amount);
      expect(await mockERC20.balanceOf(mockYieldStrategy.target)).to.equal(amount);
    });

    it("should allow withdraw, update mapping, and emit Withdraw event", async function () {
      const amount = ethers.parseEther("100");
      await mockERC20.connect(user1).approve(mockYieldStrategy.target, amount);
      await mockYieldStrategy.connect(user1).deposit(amount);
      const tx = await mockYieldStrategy.connect(user1).withdraw(amount);
      await expect(tx)
        .to.emit(mockYieldStrategy, "Withdraw")
        .withArgs(user1.address, amount);
      expect(await mockYieldStrategy.deposits(user1.address)).to.equal(0n);
      expect(await mockERC20.balanceOf(user1.address)).to.equal(ethers.parseEther("1000"));
    });

    it("should revert withdraw if balance is insufficient", async function () {
      await expect(
        mockYieldStrategy.connect(user1).withdraw(ethers.parseEther("1"))
      ).to.be.revertedWith("Insufficient balance");
    });
  });

  describe("YieldAggregator", function () {
    let localStrategyId;
    let localChainId;

    beforeEach(async function () {
      // Register a local strategy as owner
      localChainId = (await ethers.provider.getNetwork()).chainId;
      const tx = await yieldAggregator.connect(owner).addStrategy(
        mockYieldStrategy.target,
        localChainId,
        "Local Mock Strategy",
        "A local mock yield strategy for testing.",
        100,
        "ipfs://local-mock-strategy-metadata"
      );
      const receipt = await tx.wait();
      const event = receipt.logs.find(
        (log) => log.fragment && log.fragment.name === "StrategyAdded"
      );
      localStrategyId = event ? event.args.strategyId : undefined;
    });

    it("should set the owner to the deployer", async function () {
      expect(await yieldAggregator.owner()).to.equal(owner.address);
    });

    it("should prevent non-owners from adding a strategy", async function () {
      await expect(
        yieldAggregator.connect(user1).addStrategy(
          mockYieldStrategy.target,
          localChainId,
          "Should Fail",
          "Should Fail",
          100,
          "ipfs://fail"
        )
      ).to.be.reverted;
    });

    it("should add a strategy as owner and emit event", async function () {
      // Already added in beforeEach, check mapping and array
      const info = await yieldAggregator.getStrategyInfo(localStrategyId);
      expect(info.strategyAddress).to.equal(mockYieldStrategy.target);
      expect(info.chainId).to.equal(BigInt(localChainId));
      expect(info.isActive).to.equal(true);
      const ids = await yieldAggregator.getAllStrategyIds();
      const idsHex = ids.map(id => id.toLowerCase());
      expect(idsHex).to.include(localStrategyId.toLowerCase());
    });

    it("should emit StrategyAdded event when adding", async function () {
      const tx = await yieldAggregator.connect(owner).addStrategy(
        mockYieldStrategy.target,
        BigInt(localChainId) + 1n, // Use BigInt for chainId
        "Another Strategy",
        "Desc",
        101,
        "ipfs://another"
      );
      await expect(tx)
        .to.emit(yieldAggregator, "StrategyAdded");
    });

    it("should prevent non-owners from removing a strategy", async function () {
      await expect(
        yieldAggregator.connect(user1).removeStrategy(localStrategyId)
      ).to.be.reverted;
    });

    it("should set isActive to false and emit event on remove", async function () {
      const tx = await yieldAggregator.connect(owner).removeStrategy(localStrategyId);
      await expect(tx)
        .to.emit(yieldAggregator, "StrategyRemoved");
      const info = await yieldAggregator.getStrategyInfo(localStrategyId);
      expect(info.isActive).to.equal(false);
    });

    it("should return correct strategy info and handle non-existent IDs", async function () {
      const info = await yieldAggregator.getStrategyInfo(localStrategyId);
      expect(info.strategyAddress).to.equal(mockYieldStrategy.target);
      // Non-existent ID
      const fakeId = ethers.keccak256(ethers.toUtf8Bytes("fake"));
      const fakeInfo = await yieldAggregator.getStrategyInfo(fakeId);
      expect(fakeInfo.strategyAddress).to.equal(ethers.ZeroAddress);
    });

    describe("Conceptual Deposit/Withdrawal (Local Strategy)", function () {
      beforeEach(async function () {
        // Ensure strategy is active and user has no deposit
        const info = await yieldAggregator.getStrategyInfo(localStrategyId);
        expect(info.isActive).to.equal(true);
      });

      it("should update userDeposits and emit DepositRecorded on deposit", async function () {
        const amount = 1000n;
        const tx = await yieldAggregator.connect(user1).deposit(localStrategyId, amount);
        await expect(tx)
          .to.emit(yieldAggregator, "DepositRecorded")
          .withArgs(user1.address, localStrategyId, amount);
        expect(await yieldAggregator.userDeposits(user1.address, localStrategyId)).to.equal(amount);
      });

      it("should revert deposit if strategy is not active", async function () {
        await yieldAggregator.connect(owner).removeStrategy(localStrategyId);
        await expect(
          yieldAggregator.connect(user1).deposit(localStrategyId, 1000n)
        ).to.be.revertedWith("Strategy not active");
      });

      it("should update userDeposits and emit WithdrawalRecorded on withdraw", async function () {
        const amount = 1000n;
        await yieldAggregator.connect(user1).deposit(localStrategyId, amount);
        const tx = await yieldAggregator.connect(user1).withdraw(localStrategyId, amount);
        await expect(tx)
          .to.emit(yieldAggregator, "WithdrawalRecorded")
          .withArgs(user1.address, localStrategyId, amount);
        expect(await yieldAggregator.userDeposits(user1.address, localStrategyId)).to.equal(0n);
      });

      it("should revert withdraw if insufficient deposit", async function () {
        await expect(
          yieldAggregator.connect(user1).withdraw(localStrategyId, 1n)
        ).to.be.revertedWith("Insufficient deposit");
      });

      it("should return correct deposit for getUserDeposit", async function () {
        const amount = 1234n;
        await yieldAggregator.connect(user1).deposit(localStrategyId, amount);
        expect(
          await yieldAggregator.getUserDeposit(localStrategyId, user1.address)
        ).to.equal(amount);
      });
    });
  });

  describe("Cross-Chain Awareness (Simulated)", function () {
    let localStrategyId, remoteStrategyId;
    const sepoliaChainId = 11155111;
    const remoteStrategyAddress = "0x000000000000000000000000000000000000dead";

    beforeEach(async function () {
      // Register local strategy
      const localChainId = (await ethers.provider.getNetwork()).chainId;
      let tx = await yieldAggregator.connect(owner).addStrategy(
        mockYieldStrategy.target,
        localChainId,
        "Local Mock Strategy",
        "A local mock yield strategy for testing.",
        100,
        "ipfs://local-mock-strategy-metadata"
      );
      let receipt = await tx.wait();
      let event = receipt.logs.find(
        (log) => log.fragment && log.fragment.name === "StrategyAdded"
      );
      localStrategyId = event ? event.args.strategyId : undefined;

      // Register simulated remote strategy (not actually deployed on Sepolia)
      tx = await yieldAggregator.connect(owner).addStrategy(
        remoteStrategyAddress,
        sepoliaChainId,
        "Sepolia Simulated Strategy",
        "A simulated remote strategy on Sepolia.",
        200,
        "ipfs://sepolia-simulated-strategy-metadata"
      );
      receipt = await tx.wait();
      event = receipt.logs.find(
        (log) => log.fragment && log.fragment.name === "StrategyAdded"
      );
      remoteStrategyId = event ? event.args.strategyId : undefined;
    });

    it("should return correct info for both local and simulated remote strategies", async function () {
      // Local
      const localInfo = await yieldAggregator.getStrategyInfo(localStrategyId);
      expect(localInfo.chainId).to.equal(BigInt(31337));
      expect(localInfo.strategyAddress).to.equal(mockYieldStrategy.target);
      // Remote
      const remoteInfo = await yieldAggregator.getStrategyInfo(remoteStrategyId);
      expect(remoteInfo.chainId).to.equal(BigInt(sepoliaChainId));
      expect(remoteInfo.strategyAddress.toLowerCase()).to.equal(remoteStrategyAddress.toLowerCase());
    });

    it("should record conceptual deposit for simulated remote strategy (chainId distinction, not bridging)", async function () {
      // This test validates that the aggregator can record deposits for strategies on different chainIds.
      const amount = 555n;
      const tx = await yieldAggregator.connect(user1).deposit(remoteStrategyId, amount);
      await expect(tx)
        .to.emit(yieldAggregator, "DepositRecorded")
        .withArgs(user1.address, remoteStrategyId, amount);
      expect(await yieldAggregator.userDeposits(user1.address, remoteStrategyId)).to.equal(amount);
    });

    it("should record conceptual withdraw for simulated remote strategy (chainId distinction, not bridging)", async function () {
      // This test validates that the aggregator can record withdrawals for strategies on different chainIds.
      const amount = 777n;
      await yieldAggregator.connect(user1).deposit(remoteStrategyId, amount);
      const tx = await yieldAggregator.connect(user1).withdraw(remoteStrategyId, amount);
      await expect(tx)
        .to.emit(yieldAggregator, "WithdrawalRecorded")
        .withArgs(user1.address, remoteStrategyId, amount);
      expect(await yieldAggregator.userDeposits(user1.address, remoteStrategyId)).to.equal(0n);
    });
  });
}); 
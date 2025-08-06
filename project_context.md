# DeFi Yield Aggregator Project Context

## 1. Project Overview & Goals (MVP)

This project is a **Decentralized Finance (DeFi) Yield Aggregator** designed for a final year college project. Its primary goal is to identify and present yield opportunities across various DeFi protocols and provide a comprehensive risk assessment for each strategy.

**Core Deliverables for 4-Week MVP:**
* **Central Aggregator Smart Contract:** Deployed on **Polygon Amoy**.
* **Mock Yield Strategies:** Deployed for testing on **Hardhat Network**, and conceptually referenced for **Ethereum Sepolia**.
* **Risk Assessment:** Frontend-driven, incorporating both on-chain and off-chain data (e.g., simulated TVL, hardcoded audit status).
* **User Interface (Frontend):** Allows users to view strategies, their APYs, and risk scores, and conceptually "deposit" and "withdraw" funds.

## 2. Smart Contract Architecture Details

The "Aggregator Core" smart contract (`YieldAggregator.sol`) will reside on Polygon Mumbai.

### 2.1. Simplified Cross-Chain Approach (CRITICAL for Context)

* **No Direct On-Chain Bridging:** For this MVP, **actual cross-chain asset bridging will be simulated or manually managed via the frontend for demonstration purposes.** The smart contract will NOT initiate cross-chain asset transfers.
* **On-Chain Strategy Registry:** `YieldAggregator.sol` will serve as a central registry for all yield strategies, including those on "remote" chains like Ethereum Sepolia. It stores crucial minimal information about remote strategies.
* **Remote Strategy Representation:** Each strategy, regardless of its chain, will be represented by a `YieldStrategy` struct within `YieldAggregator.sol`.
    * **Key Fields (from Table 2):**
        * `strategyId` (bytes32, unique identifier generated from address and chainId)
        * `chainId` (uint256, EIP-155 chain ID of strategy's native chain)
        * `strategyAddress` (address, contract address on its native chain)
        * `isActive` (bool, for administrative control)
        * `offchainMetadataURI` (string, URI pointing to IPFS metadata for richer details)

### 2.2. Core Contracts & Functionality (from Table 1)

**`YieldAggregator.sol` (on Polygon Amoy):**
* **Ownership & Access Control:** Uses `Ownable` from OpenZeppelin. Critical functions (e.g., `addStrategy`, `removeStrategy`, `setFees`) require `onlyOwner` access.
* **Reentrancy Guard:** Uses `nonReentrant` modifier from OpenZeppelin for functions interacting with external contracts.
* **`addStrategy(address _strategyAddress, uint256 _chainId, string memory _name, string memory _description, uint256 _baseRiskScore, string memory _offchainMetadataURI)`:** Registers a new yield strategy (local or remote). Generates `strategyId` from `_strategyAddress` and `_chainId`.
* **`removeStrategy(bytes32 _strategyId)`:** Deactivates/removes a registered strategy.
* **`getStrategyInfo(bytes32 _strategyId)`:** Retrieves on-chain details of a strategy.
* **`deposit(bytes32 _strategyId, uint256 _amount)`:**
    * **Conceptual Deposit:** Records user's deposit internally (`mapping(address => mapping(bytes32 => uint256)) public userDeposits;`).
    * **No Actual Cross-Chain Transfer:** Does not initiate any actual cross-chain fund transfer.
    * Emits a `DepositRecorded` event.
* **`withdraw(bytes32 _strategyId, uint256 _amount)`:** Conceptual withdrawal, updates `userDeposits`. Emits `WithdrawalRecorded` event.
* **(Optional/Placeholder) `rebalance()` & `emergencyWithdraw()`:** Include these for completeness of concept, even if simplified or just emitting events for MVP.

**`MockERC20.sol` (on both testnets conceptually):**
* A basic OpenZeppelin `ERC20` token. Used as the mock deposit and yield asset.

**`MockYieldStrategy.sol` (on both testnets conceptually):**
* Simulates a yield-generating pool.
* Functions: `deposit(address token, uint256 amount)`, `withdraw(address token, uint256 amount)`.
* `getAPY()`: Returns a hardcoded `uint256` APY value (e.g., 500 for 5%).

### 2.3. Testnet Configuration

* **Primary Development Chain:** Hardhat Network (for local testing), Polygon Amoy (for final deployment).
* **Remote Chain:** Ethereum Sepolia (for conceptual strategies).
* **Development Framework:** Hardhat.

## 3. Risk Assessment Framework (Frontend-Driven)

* **Off-Chain Calculation:** The primary risk assessment logic will be implemented in the frontend (JavaScript) or a simple backend (if Next.js API routes are used for more complex calculations).
* **Key Risk Factors (MVP):**
    * `baseRiskScore` (from `YieldAggregator.sol` contract).
    * Protocol TVL & Age (conceptual/simulated via frontend logic).
    * Smart Contract Audit Status (hardcoded in frontend).
    * Basic Impermanent Loss Risk (conceptual, e.g., based on APY volatility heuristics).
* **Frontend Display:** Calculated risk scores/categories will be prominently displayed alongside APY.
* **Personalized Filters:** Frontend will allow users to filter strategies by risk tolerance ("Low", "Medium", "High").

## 4. Frontend Technologies & Interaction Details (NEW SECTION)

* **Framework:** Next.js (with App Router and TypeScript).
* **Web3 Library:** Wagmi (for React hooks for blockchain interaction), integrated with `ethers.js` (or `viem` if Wagmi v2 is preferred).
* **Wallet Connection:** WalletConnect Modal for multi-wallet support.
* **Styling:** Tailwind CSS for rapid and utility-first UI development.
* **Frontend-Smart Contract Interaction:**
    * Initially connects to **Hardhat Network** (`http://127.0.0.1:8545`) for local development and testing.
    * Uses Wagmi's `useReadContract` to fetch strategy details and APYs.
    * Uses Wagmi's `useWriteContract` for conceptual `deposit`/`withdraw` calls.
    * Manages network switching via `useSwitchChain` for demonstrating cross-chain flow.
* **Cross-Chain Deposit/Withdraw Flow (Frontend-driven Simulation):**
    * **If local chain strategy:** Standard transaction calls `YieldAggregator.deposit()`/`withdraw()` on the active chain.
    * **If remote chain strategy:**
        1.  Frontend prompts user to **manually switch their wallet network** to the remote chain (e.g., Sepolia) using `useSwitchChain`.
        2.  Frontend provides **explicit instructions for conceptual manual deposit** (user *imagines* depositing directly to the `MockYieldStrategy.sol` address on the remote chain).
        3.  After the user *conceptually* performs this manual transfer, they click a "Confirm Deposit" button on the UI.
        4.  This "Confirm Deposit" button then triggers a call to `YieldAggregator.deposit()` (on Polygon Mumbai's *conceptual representation* on Hardhat Network initially) to **record the conceptual deposit** within the aggregator's state.

## 5. Security & Design Patterns (from Section 2.2)

* **Access Control:** `Ownable` for critical functions.
* **Reentrancy Guard:** `nonReentrant` modifier.
* **Emergency Stop:** (Future consideration for full implementation, MVP might have simple placeholder).
* **Input Validation:** Rigorous checks on all parameters.
* **Libraries:** Extensive use of OpenZeppelin Contracts.
* **Minimize On-Chain Data:** Use `offchainMetadataURI` for richer details.

## 6. Development Milestones

### Week 2 (Completed): Smart Contract Development, Local Deployment, & Testing
* Implemented `MockERC20.sol`.
* Implemented `MockYieldStrategy.sol`.
* Implemented `YieldAggregator.sol` with `YieldStrategy` struct, `addStrategy`, `removeStrategy`, `getStrategyInfo`, and conceptual `deposit`/`withdraw`.
* Configured Hardhat for local development (Hardhat Network default) and defined public testnets.
* Wrote and executed local deployment scripts on Hardhat Network, including simulated remote strategy registration.
* Wrote and executed comprehensive Unit and Integration Tests for all smart contract functions on the Hardhat Network, explicitly covering cross-chain awareness.

### Week 3 (Current Focus): Frontend Development & Risk Assessment Integration
* Set up Next.js project with Wagmi, WalletConnect, and Tailwind CSS.
* Implement wallet connection and network switching UI.
* Fetch and display smart contract data (strategies, APYs) from Hardhat Network.
* Implement frontend-driven risk assessment logic and display risk scores.
* Implement conceptual deposit/withdrawal UI, including the guided cross-chain flow simulation.

### Week 4 (Future): Final Deployment & Demo Prep
* Deploy smart contracts to Polygon Mumbai and Ethereum Sepolia testnets.
* Connect frontend to live testnet deployments.
* Perform user acceptance testing (UAT).
* Finalize demo presentation.
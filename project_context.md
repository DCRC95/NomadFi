# DeFi Yield Aggregator Project Context


## 1. Project Overview & Goals (MVP)


[cite_start]This project is a **Decentralized Finance (DeFi) Yield Aggregator** designed for a final year college project. [cite: 1] [cite_start]Its primary goal is to identify and present yield opportunities across various DeFi protocols and provide a comprehensive risk assessment for each strategy. [cite: 2, 6]


**Core Deliverables for 4-Week MVP:**
* [cite_start]**Central Aggregator Smart Contract:** Deployed on **Polygon Mumbai**. [cite: 3, 11]
* **Mock Yield Strategies:** Deployed on **Polygon Mumbai** and **Ethereum Sepolia**.
* [cite_start]**Risk Assessment:** Frontend-driven, incorporating both on-chain and off-chain data (e.g., simulated TVL, hardcoded audit status). [cite: 6]
* [cite_start]**User Interface (Frontend):** Allows users to view strategies, their APYs, and risk scores, and conceptually "deposit" and "withdraw" funds. [cite: 17, 18]


## 2. Smart Contract Architecture Details


[cite_start]The "Aggregator Core" smart contract (`YieldAggregator.sol`) will reside on Polygon Mumbai. [cite: 3, 53, 58]


### 2.1. Simplified Cross-Chain Approach (CRITICAL for Context)


* [cite_start]**No Direct On-Chain Bridging:** For this MVP, **actual cross-chain asset bridging will be simulated or manually managed via the frontend for demonstration purposes.** [cite: 6, 14, 20, 81, 106] [cite_start]The smart contract will NOT initiate cross-chain asset transfers. [cite: 20]
* [cite_start]**On-Chain Strategy Registry:** `YieldAggregator.sol` will serve as a central registry for all yield strategies, including those on "remote" chains like Ethereum Sepolia. [cite: 5, 13, 24, 60] [cite_start]It stores crucial minimal information about remote strategies. [cite: 84, 87]
* [cite_start]**Remote Strategy Representation:** Each strategy, regardless of its chain, will be represented by a `YieldStrategy` struct within `YieldAggregator.sol`. [cite: 5, 86, 93]
    * [cite_start]**Key Fields (from Table 2 [cite: 96]):**
        * `strategyId` (bytes32, unique identifier generated from address and chainId)
        * [cite_start]`chainId` (uint256, EIP-155 chain ID of strategy's native chain) [cite: 96]
        * [cite_start]`strategyAddress` (address, contract address on its native chain) [cite: 96]
        * [cite_start]`isActive` (bool, for administrative control) [cite: 96]
        * [cite_start]`offchainMetadataURI` (string, URI pointing to IPFS metadata for richer details) [cite: 90, 96]


### 2.2. [cite_start]Core Contracts & Functionality (from Table 1 [cite: 65])


**`YieldAggregator.sol` (on Polygon Mumbai):**
* [cite_start]**Ownership & Access Control:** Uses `Ownable` from OpenZeppelin. [cite: 48] [cite_start]Critical functions (e.g., `addStrategy`, `removeStrategy`, `setFees`) require `onlyOwner` access. [cite: 43]
* [cite_start]**Reentrancy Guard:** Uses `nonReentrant` modifier from OpenZeppelin for functions interacting with external contracts. [cite: 44]
* [cite_start]**`addStrategy(address _strategyAddress, uint256 _chainId, string memory _name, string memory _description, uint256 _baseRiskScore, string memory _offchainMetadataURI)`:** Registers a new yield strategy (local or remote). [cite: 65] Generates `strategyId` from `_strategyAddress` and `_chainId`.
* [cite_start]**`removeStrategy(bytes32 _strategyId)`:** Deactivates/removes a registered strategy. [cite: 65]
* [cite_start]**`getStrategyInfo(bytes32 _strategyId)`:** Retrieves on-chain details of a strategy. [cite: 65]
* **`deposit(bytes32 _strategyId, uint256 _amount)`:**
    * [cite_start]**Conceptual Deposit:** Records user's deposit internally (`mapping(address => mapping(bytes32 => uint256)) public userDeposits;`). [cite: 102]
    * [cite_start]**No Actual Cross-Chain Transfer:** Does not initiate any actual cross-chain fund transfer. [cite: 102, 106]
    * Emits a `DepositRecorded` event.
* **`withdraw(bytes32 _strategyId, uint256 _amount)`:** Conceptual withdrawal, updates `userDeposits`. Emits `WithdrawalRecorded` event.
* [cite_start]**(Optional/Placeholder) `rebalance()` & `emergencyWithdraw()`:** Include these for completeness of concept, even if simplified or just emitting events for MVP. [cite: 65]


**`MockERC20.sol` (on both testnets):**
* A basic OpenZeppelin `ERC20` token. Used as the mock deposit and yield asset.


**`MockYieldStrategy.sol` (on both testnets):**
* Simulates a yield-generating pool.
* Functions: `deposit(address token, uint256 amount)`, `withdraw(address token, uint256 amount)`.
* `getAPY()`: Returns a hardcoded `uint256` APY value (e.g., 500 for 5%).


### 2.3. Testnet Configuration


* [cite_start]**Primary Development Chain:** Polygon Mumbai [cite: 3, 11]
* [cite_start]**Remote Chain:** Ethereum Sepolia [cite: 5, 13]
* **Development Framework:** Hardhat (preferred) or Foundry.


## 3. Risk Assessment Framework (Frontend-Driven)


* [cite_start]**Off-Chain Calculation:** The primary risk assessment logic will be implemented in the frontend (JavaScript) or a simple backend. [cite: 89, 102]
* **Key Risk Factors (MVP):**
    * `baseRiskScore` (from `YieldAggregator.sol` contract).
    * [cite_start]Protocol TVL & Age (conceptual/simulated via DefiLlama API calls in frontend/backend). [cite: 89]
    * [cite_start]Smart Contract Audit Status (hardcoded in frontend/backend). [cite: 111]
    * [cite_start]Basic Impermanent Loss Risk (conceptual, e.g., based on APY volatility heuristics). [cite: 112]
* [cite_start]**Frontend Display:** Calculated risk scores/categories will be prominently displayed alongside APY. [cite: 131]
* [cite_start]**Personalized Filters:** Frontend will allow users to filter strategies by risk tolerance ("Low", "Medium", "High"). [cite: 132]


## 4. Frontend Interaction Flow (CRITICAL for Context)


* [cite_start]**Wallet Integration:** MetaMask connection, support for switching between Polygon Mumbai and Ethereum Sepolia. [cite: 99]
* **Display Strategies:** Fetch `YieldStrategy` data from `YieldAggregator.sol` (on Polygon Mumbai). For each strategy, also call `getAPY()` on its native chain (using `ethers.js` providers for both networks).
* **Cross-Chain Deposit/Withdraw Flow:**
    * **If local chain strategy:** Standard transaction calls `YieldAggregator.deposit()`/`withdraw()`.
    * **If remote chain strategy:**
        1.  [cite_start]Frontend prompts user to **manually switch their wallet network** to the remote chain (e.g., Sepolia). [cite: 99]
        2.  [cite_start]Frontend provides **explicit instructions for manual deposit** directly to the `MockYieldStrategy.sol` address on the remote chain. [cite: 100]
        3.  After the user *conceptually* performs this manual transfer, they click a "Confirm Deposit" button on the UI.
        4.  [cite_start]This "Confirm Deposit" button then triggers a call to `YieldAggregator.deposit()` (on Polygon Mumbai) to **record the conceptual deposit** within the aggregator's state. [cite: 102]


## [cite_start]5. Security & Design Patterns (from Section 2.2 [cite: 41])


* [cite_start]**Access Control:** `Ownable` for critical functions. [cite: 43]
* [cite_start]**Reentrancy Guard:** `nonReentrant` modifier. [cite: 44]
* [cite_start]**Emergency Stop:** (Future consideration for full implementation, MVP might have simple placeholder). [cite: 45]
* [cite_start]**Input Validation:** Rigorous checks on all parameters. [cite: 46]
* [cite_start]**Libraries:** Extensive use of OpenZeppelin Contracts. [cite: 48]
* [cite_start]**Minimize On-Chain Data:** Use `offchainMetadataURI` for richer details. [cite: 50, 90]


## 6. Development Milestones (Week 2 Focus)


* **Implement `MockERC20.sol`**
* **Implement `MockYieldStrategy.sol`** (on both testnets conceptually)
* **Implement `YieldAggregator.sol`** (Polygon Mumbai) with `YieldStrategy` struct, `addStrategy`, `removeStrategy`, `getStrategyInfo`, and **conceptual `deposit`/`withdraw`**.
* **Configure Hardhat/Foundry** for Polygon Mumbai and Ethereum Sepolia testnets.
* **Write comprehensive Unit and Integration Tests** for all smart contract functions, explicitly covering cross-chain awareness (by distinct `chainId` values in strategy management and deposit recording).
* **Document limitations of cross-chain simulation** in code comments and test plans.
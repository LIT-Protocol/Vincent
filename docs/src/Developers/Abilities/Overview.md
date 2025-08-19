---
category: Developers
title: Official Abilities
children:
  - ./Aave.md
  - ./Debridge.md
  - ./Erc20Approval.md
  - ./Erc20Transfer.md
  - ./EvmTransactionSigner.md
  - ./Morpho.md
  - ./UniswapSwap.md
---

# Vincent Abilities Created by the Vincent Team

<div class="box info-box">
  <p class="box-title info-box-title">
    <span class="box-icon info-icon">Info</span> Looking for More Flexibility?
  </p>
  <p>If you need to sign EVM transactions that aren't covered by a specific Vincent Ability, use the <a href="./EvmTransactionSigner.md">EVM Transaction Signer</a> to interact with any smart contract — even those without a dedicated Vincent Ability.</p>
</div>

| Ability                                             | Category      | Description                                                                                                                                 |
| --------------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| [Aave](./Aave.md)                                   | DeFi Protocol | Integrate with the Aave V3 lending protocol to supply, borrow, repay, and withdraw assets, unlocking a full suite of DeFi lending features. |
| [Morpho](./Morpho.md)                               | DeFi Protocol | Access Morpho lending vaults for yield generation, including depositing, withdrawing, and managing positions in Morpho's markets.           |
| [Uniswap Swap](./UniswapSwap.md)                    | DeFi Protocol | Perform token swaps via Uniswap V3, enabling decentralized exchange functionality without manual user approvals.                            |
| [deBridge](./Debridge.md)                           | Cross-Chain   | Bridge tokens across multiple blockchains using the deBridge protocol, streamlining cross-chain transfers.                                  |
| [ERC20 Approval](./Erc20Approval.md)                | Utility       | Manage ERC20 token allowances, a foundational step for enabling DeFi operations like swaps, lending, and liquidity provision.               |
| [ERC20 Transfer](./Erc20Transfer.md)                | Utility       | Transfers ERC20 tokens, a basic operation of fungible assets.                                                                               |
| [EVM Transaction Signer](./EvmTransactionSigner.md) | Utility       | Sign arbitrary EVM transactions, allowing interaction with any smart contract—even those without a dedicated Vincent Ability.               |

---
category: Developers
title: Ability Developers
---

# What is a Vincent Ability?

A Vincent Ability is a function built using [Lit Actions](https://developer.litprotocol.com/sdk/serverless-signing/overview) that enables Vincent Apps to perform specific actions on behalf of Vincent App Users. These abilities are the core functional units that Vincent Apps use to interact with blockchains, APIs, and other services while being governed by user-configured [Vincent Policies](../Policy-Developers/Getting-Started.md).

## Getting Started

To begin developing Vincent Abilities, you can use the **[Vincent Ability Policy Starter Template](https://github.com/LIT-Protocol/Vincent-Ability-Policy-Starter-Template/)**. This template provides a complete development environment with pre-built examples, end-to-end testing frameworks, and development workflows for creating and testing Vincent Abilities and Policies.

## Key Capabilities of Vincent Abilities

Vincent Abilities provide powerful capabilities that enable a wide variety of blockchain and web2 actions:

- **Flexible Data Access:** Read and write both on and off-chain data to any blockchain network or HTTP-accessible API or database
- **Policy-Driven Execution:** Execute abilities only when permitted by all registered Vincent Policies for the Vincent App User
- **Cryptographic Capabilities:** Sign transactions and data on behalf of users, and utilize Lit Protocol's [Encryption and Access Control](https://developer.litprotocol.com/sdk/access-control/intro) features for conditional data access
- **Type-Safe Development:** Strongly-typed Zod schemas ensure parameter validation and clear interfaces between Vincent Abilities and Policies, and both utilize packages installed from NPM to extend functionality

## Real-World Ability Examples

**Blockchain Interactions**

- **Token Transfers**: Transfer tokens across different blockchain networks in a single ability execution
- **NFT Operations**: Mint, transfer, and manage NFTs with customizable metadata and royalty settings
- **DeFi Actions**: Interact with DeFi protocols to perform swaps, liquidity provision, or yield farming

**Data Management**

- **Cross-Chain Data**: Aggregate and process data from multiple blockchain networks
- **API Integration**: Fetch and process data from external APIs while keeping the data private
- **Database Operations**: Perform read/write operations to databases with Vincent Policy based access control

**Authentication & Security**

- **Multi-Signature Operations**: Coordinate multi-sig transactions across different wallets and blockchains
- **Encrypted Data Access**: Handle encrypted data storage and retrieval with Vincent Policy based access control
- **Identity Verification**: Verify user identity through various on-chain and off-chain methods

**Automation & Scheduling**

- **Scheduled Transactions**: Execute transactions at specific times or based on certain conditions
- **Automated Trading**: Execute trading strategies with built-in risk management
- **Event-Triggered Actions**: Respond to on-chain or off-chain events

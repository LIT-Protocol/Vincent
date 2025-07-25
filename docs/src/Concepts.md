---
category: Users
title: Key Concepts
---

# Key Concepts

Understanding the key concepts will help you make the most of the Vincent platform.

## 🔨 Tools

Tools give Vincent apps and agents the ability to perform specific actions on your behalf, like swapping tokens, depositing into DeFi protocols, or bridging. Think of them as the individual capabilities that you can grant to applications and agents.

Each tool is designed with built-in safeguards and can only perform the exact operation it was created for. For example, a Uniswap swap tool can only execute token swaps on Uniswap, it can't access other protocols or perform different types of transactions. Tools can work across multiple blockchains and incorporate real-world data to make smart decisions about when and how to execute any given operation.

## 🛡️ Policies

Policies are your personal guardrails that control when and how a given tool can be executed. They act as programmable rules that must be satisfied before any action can be taken on your behalf.
Examples of policies include daily spending limits, specific token allowlists, time-based restrictions, or even more complex conditions that factor in market data.

For example, you might use a policy to only allow trading when market volatility is below a certain threshold, or one that pauses all operations during specific market conditions. Policies give you complete control over how Vincent apps and agents operate on your behalf to ensure your assets stay protected according to your preferences.

## 📱 Apps

Apps are collections of tools and policies that work together to provide complete functionality for a given use case. When you authorize an app, you're giving it permission to use specific tools according to the boundaries you've set through your policies.

Apps can only execute the exact tools you've approved, nothing more, nothing less. Each app clearly shows which tools and policies it needs and why, so you always know what you're authorizing before you grant access.

## 🔐 Vincent Account

Your account is your secure, multi-chain wallet that facilitates all Vincent-based interactions. Each Agent Wallet is represented by a [Programmable Key Pair (PKP)](https://developer.litprotocol.com/user-wallets/pkps/overview), a decentralized key pair managed by the Lit network.

When you interact with a given Vincent app or agent, it will prompt you to delegate signing capabilities from your Agent Wallet to specific Vincent tools. By delegating these signing capabilities, you enable the Vincent App to execute specific operations on your behalf within the guardrails you define using Vincent policies.

## Security

Learn about how the Vincent platform was designed to keep your assets and data secure and fully in your control.

### Key Management

Your Vincent Agent Wallet is managed by Lit Protocol’s decentralized key management network. Secured by MPC-TSS and TEEs, Lit ensures that all key material remains non-custodial, confidential, and fully in your control.

1. MPC-TSS: Multi-party computation threshold signature schemes (MPC-TSS) split private keys into individual key shares collectively managed by the nodes in the Lit network. Keys never exist in their entirety and never leave the sealed and confidential hardware environment run by each Lit node operator.

2. TEEs: All key material and signing, decryption, and compute operations take place inside of the sealed trusted execution environments (TEEs) run by the Lit node operators. The use of the TEE ensures that all of these operations are processed securely, without ever exposing keys or other secrets to node operators or end users interacting with the network.

To read more about how Lit keeps keys secure, check out the official [security documentation](https://developer.litprotocol.com/security/introduction).

### Enforcing Permissions

All Vincent permissions are created using [Lit Actions](https://developer.litprotocol.com/sdk/serverless-signing/overview), immutable JavaScript programs that run on the Lit network. Lit Actions are blockchain agnostic, have the ability to access off-chain data, and can be used to program signing and decryption operations with Lit keys.

All Lit Actions are executed inside of the TEE present within each Lit node, meaning they remain fully confidential, enforceable, and cryptographically verifiable.

To read more about how tools and policies are secured by Lit Actions, check out the [security docs](https://developer.litprotocol.com/security/node-architecture).

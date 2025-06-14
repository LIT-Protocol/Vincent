---
category: Users
title: Concepts
---

Vincent is a platform that enables Vincent Users to delegate both on and off-chain actions to Vincent Apps. Each Vincent App has a set of Vincent Tools that allow them to perform specific actions on behalf of their Vincent Users. Vincent App tool usage is also governed by Vincent Policies, which are user-configured "guardrails" that ensure each Vincent App operates within the boundaries defined by each Vincent User.

> **Note:** The secure and non-custodial delegation of any on or off-chain action is Vincent's core innovation. Vincent Users have the ability to delegate these operations to authorized 3rd parties (Vincent Apps and Agents) to execute on their behalf, while never giving up control of their assets and data. Vincent Apps can execute authorized Vincent Tools on behalf of a given user, but they can never access private keys or sign data outside of what the user has explicitly consented to.

This guide provides definitions of the core concepts of the Vincent platform, below is a quick overview of the concepts:

| Concept Name                                                                     | Description                                                                                                                       | Example                                                                                                                    |
| -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Vincent Tool                                                                     | A function that enables Vincent Apps to perform specific actions on behalf of Vincent App Users                                   | A tool that executes token swaps on Uniswap or manages stock portfolios through a broker API                               |
| Vincent Policy                                                                   | User-configured guardrails that control how Vincent Apps can use Vincent Tools                                                    | A daily spending limit of $1,000 or a requirement for 2FA on high-value transactions                                       |
| Policy Parameters                                                                | On-chain configurable values that define how a Vincent Policy behaves for a specific Vincent App and User                         | A daily spending limit amount or list of allowed tokens for a specific trading bot                                         |
| [Lit Actions](https://developer.litprotocol.com/sdk/serverless-signing/overview) | The underlying technology that powers both Vincent Tools and Policies, enabling on and off-chain interactions                     | The code that executes token swaps or enforces spending limits using blockchain and API data                               |
| Vincent Agent Wallet                                                             | A wallet created for each Vincent User that Vincent Apps use to sign transactions on behalf of their App Users                    | A wallet delegated to a Vincent App that dollar-cost-averages into the top cryptocurrency                                  |
| Vincent App                                                                      | An application that uses Vincent Tools to perform actions on behalf of Vincent App Users governed by Vincent Policies             | A trading bot that uses Vincent Tools to execute trades while respecting user-defined spending limits and token allowlists |
| Vincent App Version                                                              | Each App Version specifies a specific set of Vincent Tools and Policies that App Users are delegating usage of to the Vincent App | Version 1 of a Vincent trading app includes utilizes a Uniswap Tool with a daily spending limit Policy                     |
| Vincent App User                                                                 | An individual who delegates actions to Vincent Apps and configures policies to control their behavior                             | A user who allows a trading bot to trade on their behalf with specific spending limits                                     |
| Vincent App Manager                                                              | The entity responsible for creating and managing a Vincent App, including its versions, tools, and policies                       | A development team that builds and maintains a trading bot, adding new features and policies in each version               |

# Vincent Tool

Vincent Tools enable Vincent Apps to perform specific actions on behalf of Vincent App Users. These tools are the core functional units that Vincent Apps use to interact with blockchains, APIs, and other services while being governed by user-configured Vincent Policies.

<!-- TODO Link to Uniswap doc page -->

Vincent Tools can read and write data to both on and off-chain sources, perform arbitrary computations, and sign blockchain transactions. This allows them to perform specific actions, such as minting a reward token based on off-chain data, or they can serve general purposes, such as enabling ERC20 token swaps using Uniswap like the Vincent Uniswap Tool.

**On-chain examples:**

- Execute automated DeFi strategies like yield farming or liquidity provision
- Manage NFT collections by buying, selling, or staking NFTs
- Perform cross-chain operations like bridging assets or executing cross-chain swaps
- Interact with DAOs by voting on proposals or executing governance actions

**Off-chain examples:**

- Integrate with traditional finance APIs to manage stock portfolios
- Connect with social media platforms to automate content posting and engagement
- Use weather APIs to trigger automated actions based on environmental conditions
- Interact with e-commerce platforms to manage inventory and process orders

Under the hood, Vincent Tools are created using [Lit Actions](https://developer.litprotocol.com/sdk/serverless-signing/overview). With the ability to natively interact with any on or off-chain data source (blockchains, social networks, TradFi, etc), Lit Actions are uniquely positioned to support the creation of tools for virtually any use case.

# Vincent Policy

Vincent Policies give users full control over defining how their assets and data are used when they interact with a given Vincent App. Each Vincent Policy is assigned to specific Vincent Tool(s) and governs their usage. For example, when interacting with a Vincent App that involves crypto trading, a Policy would be used to specify things like spend limits or token allowlists / denylists. Policies can be thought of as user-defined "guardrails" that ensure each Vincent App operates within a given Vincent App User's defined boundaries.

Just like Tools, Vincent Policies are also powered by Lit Actions under the hood. This makes them highly generalizable and well-suited to track and query on or off-chain state to make decisions based on data such as:

- Usage metrics:

  - Tool execution frequency (e.g. max 10 transactions per day)
  - Session duration limits (e.g. max 2 hours per session)
  - Concurrent operation limits (e.g. max 3 pending operations)

- Financial controls:

  - Spending amounts over time periods (e.g. daily spending limit of $1,000)
  - Token-specific limits (e.g. max 5 ERC20 tokens per transaction)
  - Portfolio allocation limits (e.g. max 20% of portfolio in any single token)

- Access controls:

  - Time-based restrictions (e.g. only during market hours)
  - Geographic limitations (e.g. restricted to specific regions)
  - Multi-factor authentication requirements (e.g. require 2FA for high-value transactions)

- Compliance and risk management:
  - Unusual transaction detection (e.g. flag transactions 3x larger than average)
  - Rate of change monitoring (e.g. alert on 50% portfolio value change in 24h)
  - KYC/AML verification requirements (e.g. require verified identity for transactions over $10,000)

## Policy Parameters

Vincent Policies utilize parameters defined by the Vincent App User that are stored on-chain, verifiable by anyone. These parameters are specific to each Vincent Tool that a Vincent App executes on behalf of the Vincent App User. Prior to the execution of a Vincent Tool, the Policy parameters are fetched from on-chain and used during the evaluation of the Vincent Policy that governs Vincent tool usage. Only Vincent App Users have the ability to configure these parameters and they can be updated at any time.

An example Policy is a daily spend limit, assigned to a Vincent App that performs token transfers on behalf of it's App Users. Without the policy, the Vincent App would be able to spend tokens from it's delegated Vincent Users (using a Vincent Tool) without restriction. After enabling the Vincent spending limit policy, the Vincent App's usage of the token transfer Vincent Tool is now governed by the configured daily spending limit set by each of it's Vincent Users. Once the daily spending limit is reached for a specific Vincent User, the Vincent App would no longer be permitted to execute the token transfer Vincent Tool until the spending limit is reset the next day. This ensures that the Vincent App User's assets are protected and their spending is controlled.

# Vincent Agent Wallet

Each Agent Wallet is a non-custodial account powered via [Secure Multi-Party Computation (MPC)](https://en.wikipedia.org/wiki/Secure_multi-party_computation) that enables seamless interactions with any Vincent App. Each Agent Wallet is represented by a [Lit Programmable Key Pair (PKP)](https://developer.litprotocol.com/user-wallets/pkps/overview) and controlled by the Vincent User's desired authentication method. Currently, Vincent supports the following authentication methods during account creation:

- Email
- SMS
- Passkey

When you interact with a given Vincent App, it will prompt you to delegate signing capabilities from your Agent Wallet to specific Vincent Tools. By delegating these signing capabilities, you enable the Vincent App to execute specific operations on your behalf without requiring your manual intervention. For example, a Vincent trading App would first prompt the user to permit it's custom Vincent swap Tool to have signing capability using their Agent Wallet. The Vincent User would then be prompted to define their desired Policy parameters, such as a spend limit. Once the Vincent User permits the Tool, and any desired Policies were set, the Vincent App would have permission to sign transactions on behalf of the Vincent User according to the guardrails the User has set

Because Vincent Agent Wallets are PKPs, Vincent Apps can never directly access Agent Wallets directly. Instead, they can only execute the Vincent Tools that the Vincent User has explicitly authorized for each Vincent App. Each Vincent Tool's code strictly defines what data can be signed, and Vincent Apps cannot modify this code or sign any data beyond the Vincent Tool's programmed scope. When a Vincent Tool needs to sign data, like a blockchain transaction, it must request the signature through the Lit network, which verifies the origin of the request came from the authorized Vincent Tool before generating the signature. Any pre-defined Vincent Policies are evaluated prior to Tool execution.

# Vincent App

A Vincent App is a collection of Vincent Tools and their associated Vincent Policies. Vincent Tools define the specific operations that the Vincent App can perform, while Vincent Policies ensure these operations are scoped according to user-defined parameters and permissions.

## App Version

Vincent App Versions define the specific set of Vincent Tools and Policies that Vincent Apps can execute on behalf of a Vincent App User. When a Vincent App User wants to delegate signing capabilities to a Vincent App, they must authorize a specific Vincent App Version.

Vincent App Managers can create new versions for their Vincent Apps, specifying new Vincent Tools and Policies that will be available to be executed by a Vincent App. Once created, Vincent App Versions are immutable and cannot be altered. Vincent Apps are only authorized to execute the Vincent Tools and Policies associated with the Vincent App Version that's been approved by the Vincent App User.

This immutability ensures that Apps can evolve and add new features through new versions, but Vincent App Users maintain complete control over what actions can be performed on behalf of their Vincent Agent Wallet. To execute new Vincent Tools and Policies, Vincent App Users must explicitly authorize a new Vincent App Version, guaranteeing that nothing can be executed without their permission.

## App Manager

A Vincent App Manager is a blockchain account (whether a standard externally owned account, or anything else that can sign Ethereum transactions) that creates and manages a Vincent App.

Vincent App Managers configure their App's metadata, including it's name, description, redirect URIs, and deployment status. They also define which Vincent Tools and Policies each Vincent App Version will use, and control which Vincent App Versions remain active and available for Vincent App Users to authorize.

## App User

A Vincent App User owns a Vincent Agent Wallet and controls what actions can be performed with it. When a Vincent App User wants to use a Vincent App, they must first authorize a specific Vincent App Version, which defines the set of Vincent Tools and Policies that Vincent Apps can execute on their behalf.

Vincent App Users maintain complete control over their assets through two key mechanisms: they explicitly authorize which Vincent App Versions can be used with their Vincent Agent Wallet, and they configure Vincent Policy parameters that restrict how Vincent Tools can be executed.

For example, a Vincent App User might authorize a trading App's Version that includes a Vincent Tool that swaps tokens on a DEX, but they set a daily spending limit of 1 ETH. The Vincent App can execute the Vincent swap Tool, but only within the constraints of the Vincent App User's configured Policy parameters.

This authorization model ensures that Vincent App Users can safely delegate actions to Vincent Apps while maintaining control over their assets and the conditions under which those assets can be used.

# How these Concepts Tie Together

The lifecycle of a Vincent App follows these steps:

1. An App Manager creates a new App, specifying the App metadata, and the Tools and Policies that the first version of the App will use
2. A User navigates to the App's webapp and clicks a button that uses the Vincent SDK to redirect to the Vincent Consent page
3. The User authenticates with Vincent and either retrieves an existing Vincent Agent wallet or creates a new one
4. The User views the Vincent App's Consent page, which displays the App metadata, the Tools and associated Policies that the App Version will use, and provides input fields for any Policy parameters configured for each Tool's Policy
5. The User approves delegation for the App Version and is redirected back to the App's webapp
6. The App's webapp receives the redirect from the Vincent Consent page and logs the User in
7. The User interacts with the webapp and clicks a button that requires execution of a Vincent Tool
8. The App's webapp backend triggers the Tool execution
9. The App collects the necessary data for the Tool execution and submits a request to the Lit Protocol network
10. The Tool begins execution and first checks which Vincent App the executor is associated with
    - If the executor is not associated with any App, execution halts and returns a not-authorized error
11. The Tool then checks which App Version the App User has authorized and retrieves the Policies and Policy parameters that the User set for the executing Tool
12. The Tool then executes each Policy, providing it with the retrieved on-chain Policy parameters
    - If any Policy returns a `false` value or an error, Tool execution halts and returns an error
13. After all Policies execute successfully, the Tool runs its logic and performs its designed actions
14. The Tool returns the execution results to the App's webapp backend

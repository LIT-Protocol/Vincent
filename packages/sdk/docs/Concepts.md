---
category: Users
title: Concepts
---

# Concepts

## Vincent Tool

A Vincent Tool is an immutable serverless function that Vincent App Delegatees can execute to perform specific actions on behalf of a Vincent App User.

Vincent Tools can serve specific use cases, such as minting a reward token based on off-chain data, or they can serve general purposes, such as enabling ERC20 token swaps using the best price across multiple DEXs.

Vincent Tools leverage Lit Protocol's [Lit Actions](https://developer.litprotocol.com/sdk/serverless-signing/overview) to execute immutable and decentralized serverless functions that can read and write data to both on and off chain sources, perform arbitrary computations, and sign blockchain transactions when a Vincent App User permits it.

## Vincent Policy

A Vincent Policy also leverages Lit Actions to determine whether a given Vincent App Delegatee can execute a Vincent Tool for a Vincent App User. These Policies serve as guardrails that Vincent App Users configure to ensure Vincent Apps can only perform actions within the Vincent App User's intended boundaries and set parameters.

Similar to Vincent Tools, Vincent Policies can serve specific use cases, such as permitting a Vincent App Delegatee to execute a Vincent Tool only when the Vincent App User holds a certain status in a Vincent App's off-chain database, or they can serve general purposes across multiple Vincent Apps, such as enforcing a daily spending limit from the Vincent App User's wallet.

Because Vincent Policies are powered by Lit Actions, they can use both on and off chain data to determine whether a Vincent Tool should execute. Vincent Policies can also write data to on and off chain sources to track state such as Vincent Tool execution frequency, spending amounts over time periods, or any other relevant Vincent Policy data.

### Policy Parameters

Vincent Policies accept parameters that customize their behavior. These parameters are stored on-chain, set by Vincent App Users when they permit a Vincent App Version, and retrieved during Vincent Policy execution to provide input for the Policy's logic.

For example, a Vincent App User can set a daily spending limit when authorizing a Vincent App Version that would apply only to that specific Vincent App. When Vincent App Delegatees execute Vincent Tools that transfer funds from the User's Agent Wallet, the Policy tracks the total spent in an on-chain smart contract. Once the daily spending limit is reached, the Vincent Policy would prevent the Vincent App Delegatees from executing any more Vincent Tools that transfer funds from the Vincent App User's Agent Wallet, until the next day.

## Vincent Agent Wallet

Vincent Agent Wallets are non-custodial wallets that enable users to interact with Vincent Apps. These wallets leverage Lit Protocol's [Programmable Key Pairs (PKPs)](https://developer.litprotocol.com/user-wallets/pkps/overview) to provide wallets that are owned by a user's _authentication method_ which include many different methods supported by Lit Protocol, such as a one-time-password sent to an email address or phone number, a passkey saved on the User's device, a social account such as a Google, X, or Telegram, and [many more](https://developer.litprotocol.com/user-wallets/pkps/advanced-topics/auth-methods/overview#existing-supported-auth-methods).

The signing capability of Vincent Agent Wallets are what's delegated to Vincent App Delegatees to allow them to execute Vincent Tools on behalf of a Vincent App User and perform on-chain actions. For example, a Vincent App that offers to trade ERC20 tokens based on some unique algorithm would add an ERC20 token swap Vincent Tool to a Vincent App Version. The Vincent App User would authorize the Vincent App Version, permitting the Vincent App Delegatees to execute the ERC20 token swap Vincent Tool on behalf of the Vincent App User, restricted by whatever Vincent Policies the Vincent App User has set for the Tool.

Because Vincent Agent Wallets are Lit Protocol PKPs, Vincent App Delegatees can never directly access a Vincent App User's Agent Wallet. Instead, they can only execute Vincent Tools that the Vincent App User has explicitly authorized. Each Vincent Tool's code strictly defines what data can be signed, and Vincent App Delegatees cannot modify this code or sign any data beyond the Vincent Tool's programmed scope. When a Vincent Tool needs to sign data, like a blockchain transaction, it must request the signature through the Lit network, which verifies the origin of the request came from the authorized Vincent Tool before generating the signature.

This security model enables Vincent's core innovation: Vincent App Users can safely delegate on-chain actions to Vincent Apps while maintaining complete control over their assets. Vincent App Delegatees can execute authorized Vincent Tools on behalf of Vincent App Users, but they can never access private keys or sign data outside of what the Vincent Tool has been programmed to do.

## Vincent App

A Vincent App bundles Vincent Tools and their associated Vincent Policies, where Vincent Tools define the actions that Vincent App Delegatees can perform on behalf of a Vincent App User, and Vincent Policies ensure these actions execute within the Vincent App User's defined parameters and permissions.

### App Version

Vincent App Versions define the specific set of Vincent Tools and Policies that Vincent App Delegatees can execute on behalf of a Vincent App User. When a Vincent App User wants to delegate signing capabilities to a Vincent App, they must authorize a specific Vincent App Version.

Vincent App Managers can create new versions for their Vincent Apps, specifying new Vincent Tools and Policies that will be available to be executed by a Vincent App Delegatee. Once created, Vincent App Versions are immutable and cannot be altered. Vincent App Delegatees are only authorized to execute the Vincent Tools and Policies associated with the Vincent App Version that's been approved by the Vincent App User.

This immutability ensures that Apps can evolve and add new features through new versions, but Vincent App Users maintain complete control over what actions can be performed on behalf of their Vincent Agent Wallet. To execute new Vincent Tools and Policies, Vincent App Users must explicitly authorize a new Vincent App Version, guaranteeing that nothing can be executed without their permission.

### App Manager

A Vincent App Manager is a blockchain account (whether a standard externally owned account, or anything else that can sign Ethereum transactions) that creates and manages a Vincent App.

Vincent App Managers configure their App's metadata, including its name, description, redirect URIs, and deployment status. They also define which Vincent Tools and Policies each Vincent App Version will use, register blockchain addresses as Vincent App Delegatees, and control which Vincent App Versions remain active and available for Vincent App Users to authorize.

### App Delegatee

Vincent App Delegatees serve as the executors of Vincent Tools on behalf of Vincent App Users. While they can trigger Vincent Tool execution, they cannot modify the Vincent Tool's code or sign arbitrary data. Their actions are strictly limited to: executing Vincent Tools that belong to a Vincent App User's authorized Vincent App Version, providing the necessary input data for Vincent Tool execution, and receiving and processing the results of Vincent Tool execution.

For example, a Vincent App Delegatee might execute a Vincent Tool that swaps tokens on a DEX. The Vincent App Delegatee can provide the swap parameters, but the actual signing of the transaction is handled by the Vincent Tool's code through the Lit network, ensuring the Vincent App Delegatee cannot modify the transaction or sign any other data.

### App User

A Vincent App User owns a Vincent Agent Wallet and controls what actions can be performed with it. When a Vincent App User wants to use a Vincent App, they must first authorize a specific Vincent App Version, which defines the set of Vincent Tools and Policies that Vincent App Delegatees can execute on their behalf.

Vincent App Users maintain complete control over their assets through two key mechanisms: they explicitly authorize which Vincent App Versions can be used with their Vincent Agent Wallet, and they configure Vincent Policy parameters that restrict how Vincent Tools can be executed.

For example, a Vincent App User might authorize a trading App's Version that includes a Vincent Tool that swaps tokens on a DEX, but they set a daily spending limit of 1 ETH. The Vincent App Delegatees can execute the Vincent swap Tool, but only within the constraints of the Vincent App User's configured Policy parameters.

This authorization model ensures that Vincent App Users can safely delegate actions to Vincent Apps while maintaining control over their assets and the conditions under which those assets can be used.

## How these Concepts Tie Together

The lifecycle of a Vincent App follows these steps:

1. An App Manager creates a new App, specifying the App metadata, and the Tools and Policies that the first version of the App will use
2. The App Manager specifies the App Delegatees that can execute the App's Tools (and their associated Policies) on behalf of App Users
3. A User navigates to the App's webapp and clicks a button that uses the Vincent SDK to redirect to the Vincent Consent page
4. The User authenticates with Vincent and either retrieves an existing Vincent Agent wallet or creates a new one
5. The User views the App Consent page, which displays the App metadata, the Tools and associated Policies that the App Version will use, and provides input fields for any Policy parameters configured for each Tool's Policy
6. The User approves delegation for the App Version and is redirected back to the App's webapp
7. The App's webapp receives the redirect from the Vincent Consent page and logs the User in
8. The User interacts with the webapp and clicks a button that requires execution of a Vincent Tool
9. The App's webapp backend triggers the Tool execution by an App Delegatee
10. The App Delegatee collects the necessary data for the Tool execution and submits a request to the Lit Protocol network
11. The Tool begins execution and first checks which Vincent App the executor (the App Delegatee) is associated with
    - If the executor is not associated with any App, execution halts and returns a not-authorized error
12. The Tool then checks which App Version the App User has authorized and retrieves the Policies and Policy parameters that the User set for the executing Tool
13. The Tool then executes each Policy, providing it with the retrieved on-chain Policy parameters
    - If any Policy returns a `false` value or an error, Tool execution halts and returns an error
14. After all Policies execute successfully, the Tool runs its logic and performs its designed actions
15. The Tool returns the execution results to the App's webapp backend
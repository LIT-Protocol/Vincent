---
category: Developers
title: Executing Vincent Tools
---

# Using the Vincent Tool Client to Execute Tools

As a Vincent App Developer, you need a structured way to execute Vincent Tools for your Vincent App Users.

The Vincent App SDK provides a streamlined, type-safe interface called the Vincent Tool Client which manages the entire execution flow of a Vincent Tool. From handling the precheck validations to confirm all prerequisites are met and Tool execution is likely to succeed, to executing the Tool's logic to perform the permitted actions on behalf of the Vincent User.

This guide will walk you through the process of using the Tool Client to execute Vincent Tools.

# How the Vincent Tool Client Works

The Vincent App SDK exports a function called `getVincentToolClient` that creates a wrapper around the Vincent Tool you'd like to execute on behalf of an App User. This function returns an instance of the Tool Client with two methods that are used to execute the Tool:

1. **Precheck**: Executes the Vincent Tool's `precheck` function to provide quick and cost-free feedback on whether the Tool execution is likely to succeed. This function also:

   - Validates the Tool parameters you provide against the Vincent Tool's requirements
   - Evaluates the `precheck` function for any Vincent Policies the User has configured for your App
     - **Note:** Execution of the Tool's `precheck` logic will **not** happen unless all of the registered Vincent Policies pass their prechecks
   - Returns the results of the Vincent Tool and Policy `precheck` functions, providing context on why the precheck logic has determined Tool execution is likely to succeed or fail

2. **Execute**: Executes the Vincent Tool using the Lit Protocol network to perform the programmed tool actions on behalf of your App User. This function also:
   - Validates Tool parameters and evaluates Policies registered by the User for your App
     - **Note:** Execution of the Tool's logic will **not** happen unless all of the registered Policies permit execution
   - Executes the `commit` function of any Policies that have defined a `commit` function
     - **Note:** Policy `commit` functions give each Policy the opportunity to update any state they depend on for their policy logic after the Tool has executed successfully (e.g. a spending limit policy would update the amount the App has spent on behalf of the Vincent User after the Tool has successfully transferred funds from the User's Agent Wallet)
   - Returns the execution results of both the Tool and any evaluated Policies

# Creating a Tool Client

To create an instance of the Tool Client, import the `getVincentToolClient` function from the `@lit-protocol/vincent-app-sdk` package. This function takes two parameters: a Vincent Tool definition and an ethers signer, returning an instance of the Tool Client.

The following code uses an example Vincent Tool package for reference:

```typescript
import { ethers } from 'ethers';
import { getVincentToolClient } from '@lit-protocol/vincent-app-sdk/toolClient';
import { bundledVincentTool } from '@example-org/vincent-tool-example-erc20-transfer';

const ethersSigner = new ethers.Wallet(process.env.VINCENT_APP_DELEGATEE_PRIVATE_KEY);

const toolClient = getVincentToolClient({
  bundledVincentTool,
  ethersSigner,
});
```

The two required parameters for the `getVincentToolClient` function are:

1. `bundledVincentTool`: The definition of the Vincent Tool you want to execute on behalf of the App User, imported from a Vincent Tool package
   - This tool definition is exported by the author of the Vincent Tool package and defines properties like the expected input parameters of the Tool, the Vincent Policies supported by the Tool, and the Tool's expected return values
   - The Tool Client handles wrapping this tool definition, providing you with a simple interface for executing the Tool, abstracting away the complexity of the Tool's implementation
2. `ethersSigner`: An Ethers.js signer that will be used to sign the request to execute the Tool using the Lit Protocol network
   - **Note:** The corresponding Ethereum address of the signer **must** be added as a delegatee for the Vincent App you are executing the Tool for. You can see how to add a delegatee to your Vincent App [here](./Creating-Apps.md#adding-delegatees-to-your-app)

# Executing the Tool Client's `precheck` function

After creating an instance of the Tool Client, the `precheck` function is now configured and ready to be executed:

> **Note:** While not mandatory, it's recommended to execute the `precheck` function before every execution of the Tool Client's `execute` function as it's quick, cost-free, and can provide important context on the current state that the Tool and it's Policies depend on (e.g. the amount of funds left to spend for a spending limit policy).

```typescript
import { ethers } from 'ethers';
import { getVincentToolClient } from '@lit-protocol/vincent-app-sdk/toolClient';
import { bundledVincentTool } from '@example-org/vincent-tool-example-erc20-transfer';

const ethersSigner = new ethers.Wallet(process.env.VINCENT_APP_DELEGATEE_PRIVATE_KEY);

const toolClient = getVincentToolClient({
  bundledVincentTool,
  ethersSigner,
});

const precheckResult = await toolClient.precheck({
  toolParams: {
    tokenAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC on Base
    recipientAddress: '0x1234567890123456789012345678901234567890',
    amount: 100,
  },
  context: {
    // The ETH address of the App User's Agent Wallet you are executing the Tool on behalf of
    delegatorPkpEthAddress: '0x1234567890123456789012345678901234567890',
  },
});
```

The `precheck` function takes two arguments:

1. An object that contains the input parameters for the Tool that has the structure of the Tool's Zod schema: `ToolParamsSchema`

> **Note:** Because Vincent Tool definitions are strongly typed, your code editor should display the expected input parameters for the Tool
>
> If for whatever reason the type inference is not working, check the Tool's documentation for the expected input parameters

2. An object that contains:
   - `rpcUrl`: An optional parameter to override the default RPC URL used to communicate with the Lit Protocol network
     - This RPC URL is used to fetch the on-chain data about your Vincent App, what App Version (if any) the Vincent User has authorized, and the on-chain Policy parameters configured by the User for your App
     - Most developers do **not** need to provide this property, and the default RPC URL should be used
   - `delegatorPkpEthAddress`: A required parameter that is the Ethereum address of the App User's Agent Wallet you'll be executing the Tool on behalf of

## Precheck Results

<!-- TODO Link to PrecheckSuccessSchema typedoc interface when it's available -->

The return type of the `precheck` function depends on the overall success or failure of the `precheck` function, as well as the results of any evaluated Policies. If all Policies are expecting to permit Tool execution, and the Tool's `precheck` function is expecting Tool execution to succeed, the `precheck` function will return a `ToolResponse` with a success result that has the structure of the Tool's Zod schema: `PrecheckSuccessSchema`.

If `precheck` returns a success result, you can execute the Tool's `execute` function with reasonable confidence that the Tool should execute successfully.

<!-- TODO Link to PrecheckFailSchema typedoc interface when it's available -->

However, if one of the evaluated Policies returns a deny response, signifying it's expecting to deny Tool execution, or all Policies permit execution, but the Tool's `precheck` function is expecting Tool execution to fail, the `precheck` function will return a `ToolResponse` with a failure result that has the structure of the Tool's Zod schema: `PrecheckFailSchema`.

If `precheck` returns a failure result, you should check the `error` property on the result object to see if there was a known error that occurred during the execution of the Tool's `precheck` function. Additionally, if one of the evaluated Polices has denied Tool execution, you should check the result object's `context.policiesContext` property to see which Policy denied Tool execution and why.

# Executing the Tool Client's `execute` function

<div class="box info-box">
  <p class="box-title info-box-title">
    <span class="box-icon info-icon">Info</span> Before executing the Tool
  </p>
  <p>Executing a Tool using the Lit Protocol network requires a <a href="https://developer.litprotocol.com/paying-for-lit/capacity-credits">Lit Capacity Credit</a> minted for the Ethereum Address you're using for the `ethersSigner` when creating the Tool Client instance with `getVincentToolClient`.</p>
  <p>In order to mint a Capacity Credit, you'll need to have tokens on Lit Protocol's Yellowstone blockchain. You can use <a href="https://chronicle-yellowstone-faucet.getlit.dev/">this faucet</a> to get the Lit test tokens used to pay for minting a Capacity Credit.</p>
  <p>To mint a Capacity Credit using the Lit Explorer, please see <a href="https://developer.litprotocol.com/paying-for-lit/minting-capacity-credit/via-explorer">this guide</a>. To mint a Credit programmatically, refer to <a href="https://developer.litprotocol.com/paying-for-lit/minting-capacity-credit/via-contract">this guide</a>.</p>
</div>

After executing the `precheck` function and getting a success result, you can execute the Tool Client's `execute` function to perform the programmed action of the Vincent Tool.

```typescript
import { ethers } from 'ethers';
import { getVincentToolClient } from '@lit-protocol/vincent-app-sdk/toolClient';
import { bundledVincentTool } from '@example-org/vincent-tool-example-erc20-transfer';

const ethersSigner = new ethers.Wallet(process.env.VINCENT_APP_DELEGATEE_PRIVATE_KEY);

const toolClient = getVincentToolClient({
  bundledVincentTool,
  ethersSigner,
});

const executeResult = await toolClient.execute({
  toolParams: {
    tokenAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC on Base
    recipientAddress: '0x1234567890123456789012345678901234567890',
    amount: 100,
  },
  context: {
    // The ETH address of the Agent Wallet you are executing the Tool on behalf of
    delegatorPkpEthAddress: '0x1234567890123456789012345678901234567890',
  },
});
```

The `execute` function takes two arguments similar to the `precheck` function:

1. An object that contains the input parameters for the Tool that has the structure of the Tool's Zod schema: `ToolParamsSchema`

> **Note:** Because Vincent Tool definitions are strongly typed, your code editor should display the expected input parameters for the Tool
>
> If for whatever reason the type inference is not working, check the Tool's documentation for the expected input parameters

2. An object that contains:
   - `delegatorPkpEthAddress`: A required parameter that is the Ethereum address of the Vincent User's Agent Wallet you'll be executing the Tool on behalf of

## Execute Results

The return type of the `execute` function depends on whether all evaluated Policies permitted Tool execution, as well as if the Tool's execution was successful.

If one of the Policies returns a deny response, or an error occurs during the execution of the Tool's logic, the `execute` function will return a failure result with the structure of the Tool's Zod schema: `ExecuteFailSchema`.

Additionally, Vincent Policies have an optional `commit` function (as covered in the [How Vincent Policies Work](#how-the-tool-client-sdk-works) section), which is executed for each Policy that has defined a `commit` function after the Tool's logic is executed successfully. If one of the `commit` functions were to fail during execution or return a deny response, the `execute` function will return a failure result.

If all evaluated Policies permit execution, the Tool's execution is successful, and all the Policy `commit` functions are executed successfully, the `execute` function will return a success result with the structure of the Tool's Zod schema: `ExecuteSuccessSchema`.

# Wrapping Up

You now have a complete understanding of how to execute Vincent Tools using the Tool Client. From running prechecks to evaluate Tool readiness, to executing Tools on behalf of App Users with Policy-enforced constraints, the Tool Client simplifies the full lifecycle of Vincent Tool execution.

As a quick recap:

- Import the `bundledVincentTool` tool definition from the Vincent Tool package you're using
- Use `getVincentToolClient` to create an instance of the Tool Client for a specific Vincent Tool
- Always run the `precheck` method first to validate Tool parameters, ensure all user-configured Vincent Policies permit execution, and check whether the Tool's execution is likely to succeed
- If the `precheck` passes, use the `execute` method on the Tool Client to execute the Tool’s logic
- After successful execution of the Tool's logic, any evaluated Vincent Policies with commit functions will automatically update their internal state, keeping your App compliant with the User's defined Policy limits

## Next Steps

If you're interested in creating your own Vincent Tool and Policies, checkout the [Creating Tools](../Tool-Developers/Creating-Tools.md) and [Creating Policies](../Policy-Developers/Creating-Policies.md) guides.

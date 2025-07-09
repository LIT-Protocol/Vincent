---
category: Developers
title: AI Tool Development
---

# Efficiently creating new Vincent Tools with AI

We've added extensive documentation and support for LLM coding agents to our [Tool and Policy Starter Template](https://github.com/LIT-Protocol/Vincent-Tool-Policy-Starter-Template) with built in files like CLAUDE.md for Claude Code and AGENTS.md for OpenAI Codex.

We recommend using Claude Code for the best results. Claude Code was able to one-shot a Morpho tool, using our AAVE tool as a reference, which resulted in our [Vincent DeFi Tools Repo](https://github.com/LIT-Protocol/VincentDeFiTools).

## Recommended Tools

- [Claude Code](https://www.anthropic.com/claude/code) - Claude Code seems to be the most reliable for generating Vincent Tools and Policies.
- [ref.tools MCP](https://www.ref.tools) - The ref.tools MCP is a great tool to give your LLM more context about SDKs you're using. It has API docs for many SDKs, and can help your LLM understand how to use them. You'll need to create free API key on their website to use it.
- [Tenderly](https://tenderly.dev) - Great for debugging blockchain txns and issues.
- [Vincent Tool Policy Starter Template](https://github.com/LIT-Protocol/Vincent-Tool-Policy-Starter-Template) - A great starting point for creating new Vincent Tools and Policies.

## Tips for using AI to create Vincent Tools

- Use the [Vincent Tool Policy Starter Template](https://github.com/LIT-Protocol/Vincent-Tool-Policy-Starter-Template) as a reference for the structure of a Vincent Tool
- Tell your agent to look at the existing tools in that repo for reference. Do not delete the existing tools until your agent has finished creating the new tool and you've tested that it works.
- Tell your agent to add e2e tests in the `vincent-e2e` folder. It may be easiest to tell it to add your new tests to the existing test file, so that the test setup is correct.
- Stage things on-chain yourself, manually, to make less work for the LLM. For example, if you're creating a policy to interact with a Gnosis SAFE, you should deploy it yourself and provide the address in an ENV variable.
- LLMs struggle with blockchains in various ways. Some issues we've run into:
  - Various formatting and unit issues with ERC20 token decimals, specifically the fact that USDC has 6 decimals, but ethereum has 18 decimals. We've found that using the `formatUnits` and `parseUnits` functions from ethers.js can help with this.
  - Issues finding the correct token and contract addresses. Ask the LLM if there's an NPM package that exports these for you - there often is, and it's better than hardcoding addresses for a few chains. This will also make your tool support more chains.
  - Making txns on the wrong chain, or using the wrong RPC URL for the chain you're targeting. Make sure you give the LLM the correct RPC URL for the chain you're targeting in your tests.
  - Blockchain development in general is a bit of a black box for LLMs. Once your tests are outputting a tx hash, or just various tx params, you can go to [tenderly](https://tenderly.dev) to debug the tx hash or simulate the tx params. Tenderly will provide the exact line number where the txn is reverting, which lets you see where in the contract the error is happening, and what's causing it.

## How we created the Morpho tool

[This repo](https://github.com/LIT-Protocol/VincentDeFiTools) only contained the AAVE tool, and we wanted to add a Morpho tool. We used Claude Code to create the Morpho tool, and it was able to one-shot the tool. Here's a summary of the process:

1. We asked Claude Code to create a new tool, and to use the AAVE tool as a reference. We used a prompt that was similar to the following:

```
make a new vincent tool that lets users deposit and withdraw from morpho vaults.  look at the existing aave tool and the e2e.ts file for reference, and make a new test file for morpho.
```

2. We manually debugged some funding issues in the test, to ensure that the PKP being used had funds on the correct chain. We asked the LLM to fund the PKP with ETH and WETH, and to use the correct RPC URL for the chain we were targeting.

3. Once we saw that it was making real txns, which were reverting, we went to [tenderly](https://tenderly.dev) to debug the tx hash. The problem is that we were formatting the decimals of the token incorrectly, and once fixed, the tests passed.

4. We reviewed the tests, and asked the LLM to add more checks after each operation, to ensure that the tool was working as expected.

5. We reviewed the tool and tests, and saw that it was using hardcoded addresses for the token and vault contract addresses. We asked the LLM to use an NPM package or other dynamic method to retrieve these addresses. The LLM found the Morpho GraphQL API, and used that to get the token and contract addresses, and replaced the hardcoded addresses with the dynamic ones.

6. We then added some additional tests of the vault search functionality, to ensure that it was working correctly.

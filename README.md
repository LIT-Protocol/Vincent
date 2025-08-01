# Hello, Vincent

Vincent is an open framework for creating programmable, user controlled agents and vaults. Built on [Lit Protocol](https://developer.litprotocol.com/what-is-lit) and powered by decentralized key management and policy enforcement, Vincent enables secure delegation of both on-chain and off-chain actions without compromising user control.

With Vincent, you can build agents that automate the execution of operations across smart contracts on crypto networks, traditional finance (TradFi), and e-commerce platforms—all while ensuring users retain full control over their assets and data.

Powered by Lit’s [decentralized key management network](https://developer.litprotocol.com/resources/how-it-works) and smart contracts, Vincent is your gateway to the future of the automated, User-Owned Web.

# Key Concepts

## Vincent Agent Wallets

Non-custodial accounts controlled by users and backed by Lit [Programmable Key Pairs (PKPs)](https://developer.litprotocol.com/user-wallets/pkps/overview), used to delegate signing authority to Vincent Apps during Ability execution.

[Learn more](https://docs.heyvincent.ai/documents/Concepts.html#vincent-agent-wallet)

## Vincent Abilities

Vincent Abilities are immutable functions, built with [Lit Actions](https://developer.litprotocol.com/sdk/serverless-signing/overview), that define the specific operations a Vincent App can perform on behalf of users. Abilities can interact with blockchains, APIs, and databases but only execute when permitted by all active Vincent Policies configured by the user.

[Learn more](https://docs.heyvincent.ai/documents/Ability_Developers.html)

## Vincent Policies

Vincent Policies are programmable guardrails that govern how and when Abilities can be executed. Built using Lit Actions, Policies enforce user-defined constraints like spending limits, multi-factor authentication, rate limits, or time-based access before any Ability can run.

Each Policy has user-configurable parameters, supports on/off-chain data access, and can persist state across executions. Users define the exact conditions under which a Vincent App can act on their behalf and can update or revoke those conditions at any time.

[Learn more](https://docs.heyvincent.ai/documents/Policy_Developers.html)

## Vincent App

Vincent Apps enable secure, policy-governed automation on behalf of users—without compromising custody or control. Users delegate specific on- and off-chain actions to your App via Vincent Abilities, each governed by user-configured Policies. Every action is explicitly authorized, auditable, and constrained to the boundaries set by the user.

Apps are bundled as versioned packages and must be approved via the Connect Page before they can execute any actions.

[Learn more](https://docs.heyvincent.ai/documents/App___Agent_Developers.html)

## Connect Page

The Connect Page is a standard interface where users review a Vincent App, approve its requested Abilities and Policies, and configure any policy parameters. Vincent Apps use the Connect page to authenticate their users and execute Abilities on their behalf.

## On-chain App Registry

The On-chain App Registry is a smart contract that tracks which Vincent Apps, Abilities, and Policies each user has authorized for their Agent Wallet, ensuring only Abilities authorized by the user can be executed by the specific Apps they've permitted to act on their behalf.

# How It All Fits Together

### Vincent Developer Workflow

1. Registers a Vincent App using the [Vincent App Dashboard](https://dashboard.heyvincent.ai/), selecting the from the existing Abilities and Policies their App will use
2. Optionally creates and publishes custom Abilities and Policies tailored to their App’s functionality
3. Integrates the Vincent App SDK to authenticate users and redirect them to the Vincent Connect Page for delegation
4. Executes Abilities on behalf of authenticated users, governed by the Vincent Policies each user has configured for their App

### Vincent User Workflow

1. Visits a Vincent App and is redirected to the Vincent Connect Page to log in or create their Agent Wallet
2. Reviews the App’s requested Abilities, configures Policy parameters, and approves the delegation
3. Is redirected back to the App with a signed Vincent JWT, enabling the App to execute the approved Abilities on their behalf within the user’s configured Policy limits

# Why Vincent?

Vincent optimizes for security, interoperability, and user-control to redefine how agents interact across Web3 and beyond:

- **Decentralized Key Management**: Vincent leverages Lit Protocol's [Programmable Key Pairs](https://developer.litprotocol.com/user-wallets/pkps/overview) (PKPs) to securely manage agent identities without exposing private keys.
- **Verifiable, Fine-Grained Policies**: Users have full control over the policies they set and can revoke them at any time. Policies are fine-grained to specific operations and verifiable on-chain.
- **Cross-Platform Automation**: With Vincent, agents can operate seamlessly across any blockchain or off-chain platform. Build agent-powered apps and abilities for DeFi, TradFi, E-Commerce, and more.
- **Agent Marketplace**: Vincent will eventually serve as a marketplace for Vincent-powered apps and abilities, enabling them to be discovered and interacted with by end users.
- **Open Source**: Fork, customize, and contribute to the [Vincent codebase](https://github.com/LIT-Protocol/Vincent) to shape the future of the agent-driven and user-controlled Web.

# Useful Links

- [Vincent Docs](https://docs.heyvincent.ai/modules.html)
- [Automated Dollar-Cost Averaging Demo](https://demo.heyvincent.ai/)
- [Telegram Community](https://t.me/+aa73FAF9Vp82ZjJh)

# Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for setup instructions and development guidelines.

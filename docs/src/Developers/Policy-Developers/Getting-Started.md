---
category: Developers
title: Policy Developers
---

# What is a Vincent Policy?

A Vincent Policy is a function built using [Lit Actions](https://developer.litprotocol.com/sdk/serverless-signing/overview) and is a programmable guardrail for [Vincent Ability](../Ability-Developers/Getting-Started.md) executions. These policies have user-configurable parameters and determine whether a Vincent App can execute specific Vincent Abilities on behalf of a Vincent App User, ensuring that autonomous agents and Vincent Apps operate strictly within user-defined boundaries.

## Key Capabilities of Vincent Policies

- **Flexible Data Access:** Read and write both on and off-chain data to any blockchain network or HTTP-accessible API or database
- **Stateful Policy Management:** Persist data across executions to track cumulative metrics and implement sophisticated rules like spending limits, rate limiting, and usage quotas
- **Cryptographic Capabilities:** Utilize Lit Protocol's [Encryption and Access Control ](https://developer.litprotocol.com/sdk/access-control/intro) features for computing over private data within Lit's secure [Trusted Execution Environment (TEE)](https://en.wikipedia.org/wiki/Trusted_execution_environment)
- **Type-Safe Development:** Strongly-typed Zod schemas ensure parameter validation and clear interfaces between Vincent Abilities and Policies, and both utilize packages installed from NPM to extend functionality

## Real-World Policy Examples

**Financial Controls**

- **Daily Spending Limits**: Track cumulative spending by storing transaction amounts on or off-chain and deny Vincent Ability execution when limits are exceeded
- **Multi-Signature Requirements**: Require additional approvals for high-value transactions by integrating with on or off-chain approval systems
- **Token Allowlists**: Restrict transactions to specific token types or verified contract addresses

**Access Management**

- **Membership Gates**: Verify ownership of on-chain assets (like NFTs), or off-chain data (like Discord roles) before allowing access to premium features
- **Time-Based Restrictions**: Only allow Vincent Ability execution during specific hours, days, or based on cooldown periods

**Usage Limits**

- **Rate Limiting**: Track API usage frequency and implement cooldown periods between executions
- **Compliance Monitoring**: Enforce regulatory requirements by checking transaction amounts against legal limits
- **Geographic Restrictions**: Use IP geolocation APIs to restrict access based on user location

**Risk Management**

- **Transaction Pattern Analysis**: Monitor spending patterns and flag suspicious activity that deviates from normal behavior
- **Circuit Breakers**: Automatically disable abilities when unusual activity is detected or system-wide limits are reached
- **Emergency Stops**: Implement admin-controlled emergency stops that can pause policy-governed operations

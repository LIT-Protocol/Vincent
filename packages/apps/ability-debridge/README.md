# Vincent Ability deBridge

Bridge tokens across multiple blockchains using the deBridge protocol. Supports native tokens and
ERC-20 tokens with automatic quote fetching and gas estimation.

## Features

- Cross-chain transfers between multiple EVM-compatible chains
- Support for both native tokens (ETH, MATIC, etc.) and ERC-20 tokens
- Automatic quote fetching from deBridge API
- Gas estimation and fee calculation
- Integrated with Vincent Ability SDK for secure execution

## Installation

```bash
npm install @lit-protocol/vincent-ability-debridge
```

## Usage

```typescript
import { getVincentAbilityClient } from '@lit-protocol/vincent-app-sdk';
import { bundledVincentAbility as deBridgeAbility } from '@lit-protocol/vincent-ability-debridge';
import { ethers } from 'ethers';

// Initialize the ability client
const deBridgeClient = getVincentAbilityClient({
  bundledVincentAbility: deBridgeAbility,
  ethersSigner: yourSigner, // Your ethers signer
});

// Example: Bridge 0.1 ETH from Base to Arbitrum
const bridgeParams = {
  rpcUrl: 'https://base-mainnet.g.alchemy.com/v2/YOUR_KEY',
  sourceChain: '8453', // Base
  destinationChain: '42161', // Arbitrum
  sourceToken: '0x0000000000000000000000000000000000000000', // Native ETH
  destinationToken: '0x0000000000000000000000000000000000000000', // Native ETH
  amount: ethers.utils.parseEther('0.1').toString(), // 0.1 ETH in wei
  recipientAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD7e',
  operation: 'BRIDGE',
  slippageBps: 100, // 1% slippage
};

// First run precheck
const precheckRes = await deBridgeClient.precheck(bridgeParams, {
  delegatorPkpEthAddress: pkpAddress,
});

if (precheckRes.success) {
  // Then execute
  const executeRes = await deBridgeClient.execute(bridgeParams, {
    delegatorPkpEthAddress: pkpAddress,
  });

  if (executeRes.success) {
    console.log('Transaction hash:', executeRes.result.data.txHash);
    console.log('Order ID:', executeRes.result.data.orderId);
  }
}
```

## Supported Chains

- Ethereum (1)
- Polygon (137)
- Arbitrum (42161)
- Optimism (10)
- Base (8453)
- BSC (56)
- Avalanche (43114)

## Parameters

| Parameter          | Type     | Required | Description                                                                |
| ------------------ | -------- | -------- | -------------------------------------------------------------------------- |
| `rpcUrl`           | `string` | ✅       | RPC URL for the source chain                                               |
| `sourceChain`      | `string` | ✅       | Source chain ID (e.g., '1' for Ethereum, '8453' for Base)                  |
| `destinationChain` | `string` | ✅       | Destination chain ID                                                       |
| `sourceToken`      | `string` | ✅       | Source token address (use zero address for native token)                   |
| `destinationToken` | `string` | ✅       | Destination token address (use zero address for native token)              |
| `amount`           | `string` | ✅       | Amount in base units (wei for ETH, smallest unit for tokens)               |
| `recipientAddress` | `string` | ✅       | Recipient address on destination chain                                     |
| `operation`        | `string` | ✅       | `BRIDGE` for direct transfers, `BRIDGE_AND_SWAP` for cross-asset transfers |
| `slippageBps`      | `number` | ❌       | Slippage tolerance in basis points (default: 100 = 1%)                     |

⚠️ **Important**: The `amount` parameter must be in the token's smallest unit (e.g., wei for ETH).

## Prerequisites

- Node.js 16+ and npm/yarn
- Sufficient token balance for the bridge amount + fees
- Properly configured PKP wallet with required permissions
- For ERC-20 tokens: Sufficient token allowance for the deBridge contract

## Building

```bash
# Build the ability
npm run build

# Build all abilitys and policies
npm run vincent:build
```

## Testing

```bash
# Run unit tests
npm test

# Run E2E tests
npm run test:e2e
```

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines on how
to contribute to this project.

## License

This project is licensed under the MIT License - see the [LICENSE](../../LICENSE) file for details.

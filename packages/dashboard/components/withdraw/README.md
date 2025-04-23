# WalletConnect Integration for PKPEthersWallet

This component allows users to connect their PKP wallet to dApps using WalletConnect protocol.

## Features

- Generate QR codes for WalletConnect pairing
- Manage active dApp connections
- Sign transactions and messages using PKP wallet
- Support for various EVM chains

## Setup Requirements

Make sure to set the following environment variable in your `.env.local` file:

```
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=YOUR_PROJECT_ID
```

You can obtain a WalletConnect Project ID by registering at [WalletConnect Cloud](https://cloud.walletconnect.com).

## Usage

```tsx
import { WalletConnect } from '@/components/withdraw';

const YourComponent = () => {
  return (
    <WalletConnect 
      sessionSigs={sessionSigs}
      agentPKP={agentPKP}
      chainId="ethereum" // or any other LIT_CHAINS chain ID
      onStatusChange={(message, type) => {
        console.log(message, type);
      }}
    />
  );
};
```

## How It Works

1. The component initializes a WalletConnect SignClient and a PKPEthersWallet
2. When a user clicks "Connect to dApp", it generates a WalletConnect pairing QR code
3. The user scans this QR code with a dApp to establish a connection
4. When the dApp sends signing requests, the component handles them using the PKP wallet
5. The component supports transaction signing, message signing, and typed data signing

## Dependencies

- `@walletconnect/sign-client`
- `@walletconnect/jsonrpc-utils`
- `qrcode.react`
- `@lit-protocol/pkp-ethers`
- `@lit-protocol/lit-node-client`

## Implementation Details

The component performs several key functions:

1. **Session Management**: Tracks active dApp connections and allows the user to disconnect them.
2. **QR Code Generation**: Creates a WalletConnect compatible QR code with the session URI.
3. **Request Handling**: Supports various Ethereum JSON-RPC methods, including:
   - `eth_sendTransaction`
   - `eth_sign` 
   - `personal_sign`
   - `eth_signTypedData`
   - `eth_signTypedData_v4`
4. **PKP Integration**: All signing requests are processed using the user's PKP wallet, leveraging the Lit Protocol network.

## Customization

The component includes default styling that matches the Vincent dashboard UI. You can customize the appearance by modifying the component or by adding additional className props if needed. 
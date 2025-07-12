# Chronicle Yellowstone Chain Configuration

## Using it on React

### main.tsx

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { Config, WagmiProvider } from 'wagmi';
import { getChain } from '@lit-protocol/vincent-contracts';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter as Router } from 'react-router-dom';

const queryClient = new QueryClient();
const chronicleYellowstone = getChain('chronicle-yellowstone');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <Router>
    <React.StrictMode>
      <WagmiProvider config={chronicleYellowstone.wagmiConfig as Config}>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </WagmiProvider>
    </React.StrictMode>
  </Router>,
);
```

### App.tsx

```tsx
import "./App.css";
import { createDatilChainManager } from "@lit-protocol/vincent-contracts";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { getWalletClient } from "@wagmi/core";
import { useConfig } from "wagmi";

function App() {
  const config = useConfig();
  const account = useAccount();
  const { connectors, connect, status, error } = useConnect();
  const { disconnect } = useDisconnect();

  const test = async () => {
    console.log(config);
    const walletClient = await getWalletClient(config);

    console.log(walletClient);
    const chainManager = createDatilChainManager({
      account: walletClient,
      network: "datil",
    });

    console.log(chainManager);
  };
```

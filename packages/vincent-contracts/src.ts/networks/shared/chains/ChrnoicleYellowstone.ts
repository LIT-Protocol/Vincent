import { Chain, http, webSocket } from 'viem';
import { createConfig } from 'wagmi';

export class ChrnoicleYellowstone {
  public static rpcUrls: string[] = ['https://yellowstone-rpc.litprotocol.com/'];
  public static explorerUrl: string = 'https://yellowstone-explorer.litprotocol.com/';

  public static chainConfig() : Chain{
    return {
      id: 175188,
      name: 'Chronicle Yellowstone - Lit Protocol Testnet',
      nativeCurrency: {
        name: 'Test LPX',
        symbol: 'tstLPX',
        decimals: 18,
      },
      rpcUrls: {
        default: {
          http: ChrnoicleYellowstone.rpcUrls,
          webSocket: [],
        },
        public: {
          http: ChrnoicleYellowstone.rpcUrls,
          webSocket: [],
        },
      },
      blockExplorers: {
        default: {
          name: 'Yellowstone Explorer',
          url: ChrnoicleYellowstone.explorerUrl,
        },
      },
    };
  }

  /**
   * Here's how your use it:
   * <WagmiProvider config={config}>
   *   <ExampleComponent />
   * </WagmiProvider>
   *
   * import React, { useEffect } from "react";
   * import { usePublicClient, useWalletClient } from "wagmi";
   * import { createLitContracts } from "../createLitContracts";
   *
   * export function ExampleComponent() {
   *   const publicClient = usePublicClient();
   *   const { data: walletClient } = useWalletClient();
   *
   *   useEffect(() => {
   *     if (publicClient && walletClient) {
   *       // Pass wagmi's clients into your Lit function
   *       const { pkpNftContract, pkpHelperContract } = createLitContracts(
   *         "datil-dev",
   *         {
   *           publicClient,
   *           walletClient,
   *         }
   *       );
   *
   *       // Now you can do contract reads/writes with the user's wallet
   *       (async () => {
   *         const cost = await pkpNftContract.read.mintCost();
   *         console.log("mintCost =", cost);
   *       })();
   *     }
   *   }, [publicClient, walletClient]);
   *
   *   return <div>My wagmi + Lit example</div>;
   * }
   */
  public static wagmiConfig() {
    return createConfig({
      chains: [ChrnoicleYellowstone.chainConfig()],
      transports: {
        [ChrnoicleYellowstone.chainConfig().id]: http(),
      },
    });
  }
}
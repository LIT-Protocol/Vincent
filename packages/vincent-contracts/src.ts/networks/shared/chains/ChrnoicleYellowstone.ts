import { http } from 'viem';
import { createConfig } from 'wagmi';

export class ChrnoicleYellowstone {
  public static rpcUrls: string[] = ['https://yellowstone-rpc.litprotocol.com/'];
  public static explorerUrl = 'https://yellowstone-explorer.litprotocol.com/';

  /**
   * You'll likely need to cast this to Viem's Chain type for type safety.
   * We don't do it here to avoid version conflicts with your Viem package.
   */
  public static chainConfig() {
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
   * Please refer to the README.md file for usage examples
   */
  public static wagmiConfig = createConfig({
    chains: [ChrnoicleYellowstone.chainConfig()],

    transports: {
      [ChrnoicleYellowstone.chainConfig().id]: http(),
    },
  });
}

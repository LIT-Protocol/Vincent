import { defineChain } from "viem";

export const yellowstone = defineChain({
    id: 175188,
    name: "Chronicle Yellowstone - Lit Protocol Testnet",
    nativeCurrency: { name: "tstLPX", symbol: "tstLPX", decimals: 18 },
    rpcUrls: {
        default: { http: ["https://yellowstone-rpc.litprotocol.com"] },
    },
    blockExplorers: {
        default: {
            name: "Yellowstone Explorer",
            url: "https://yellowstone-explorer.litprotocol.com/",
        },
    },
}); 
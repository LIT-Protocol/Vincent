import { defineChain } from "viem";

export const yellowstone = defineChain({
    id: 175188,
    name: "Yellowstone",
    nativeCurrency: { name: "Yellowstone", symbol: "YSL", decimals: 18 },
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
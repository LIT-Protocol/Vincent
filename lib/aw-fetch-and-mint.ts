import { LitContracts } from "@lit-protocol/contracts-sdk";
import { ethers } from "ethers";

async function mintAW() {}

async function fetchAWForUserPKP(network: any, userPKPAddress: string) {
    let PKP_NFT_CONTRACT = {
        datil: "0x80ac58cd",
        "datil-dev": "0x80ac58cd",
        "datil-test": "0x80ac58cd",
    } as { [key: string]: string };
    
    try {
        const provider = new ethers.providers.JsonRpcProvider(
            process.env.RPC_URL
        );

        // Get all token transfer events to this address
        const filter = {
            topics: [
                ethers.utils.id("Transfer(address,address,uint256)"),
                null,
                ethers.utils.hexZeroPad(userPKPAddress.toLowerCase(), 32),
            ],
            fromBlock: 0,
            toBlock: "latest",
        };

        const logs = await provider.getLogs(filter);

        // Extract unique contract addresses
        const contractAddresses = [...new Set(logs.map((log) => log.address))];

        // Filter for only NFT contracts by checking interface support
        const awAddresses = await Promise.all(
            contractAddresses.map(async (address) => {
                try {
                    const contract = new ethers.Contract(
                        address,
                        [
                            "function supportsInterface(bytes4) view returns (bool)",
                        ],
                        provider
                    );
                    const isNFT = await contract.supportsInterface(
                        PKP_NFT_CONTRACT[network]
                    );
                    return isNFT ? address : null;
                } catch {
                    return null;
                }
            })
        );

        // Remove null values and return unique addresses
        return awAddresses.filter((address) => address !== null);
    } catch (error) {
        console.error("Error fetching AW addresses:", error);
        throw error;
    }
}

async function fetchAWBal() {}

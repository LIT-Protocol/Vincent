import { VINCENT_APP_REGISTRY_ADDRESS, VINCENT_APP_REGISTRY_ABI } from "./config";
import { ethers } from "ethers"

async function test() {
    const provider = new ethers.providers.JsonRpcProvider("https://yellowstone-rpc.litprotocol.com");
    const signer = new ethers.Wallet("d653763be1854048e1a70dd9fc94d47c09c790fb1530a01ee65257b0b698c352", provider);
    const contract = new ethers.Contract(VINCENT_APP_REGISTRY_ADDRESS, VINCENT_APP_REGISTRY_ABI, signer);
    const tx = await contract.registerApp();
    console.log(tx);
}

test();

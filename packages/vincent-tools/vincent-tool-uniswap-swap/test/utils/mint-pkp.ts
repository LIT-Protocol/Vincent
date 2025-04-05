import { ethers } from 'ethers';
import { LIT_NETWORK, AUTH_METHOD_TYPE, AUTH_METHOD_SCOPE } from "@lit-protocol/constants";
import { LitContracts } from "@lit-protocol/contracts-sdk";

const YELLOWSTONE_RPC_URL = 'https://yellowstone-rpc.litprotocol.com/';

export interface PKPInfo {
    publicKey: string;
    tokenId: string;
    ethAddress: string;
}

/**
 * Helper function to mint a new PKP and return its information
 * @param pkpOwnerPrivateKey Private key of the wallet that will own the PKP
 * @param litNetwork Lit network to use
 * @returns PKP information including tokenId, publicKey, and ethAddress
 */
export const mintNewPkp = async (
    pkpOwnerPrivateKey: string,
    vincentErc20ApprovalToolIpfsCid: string,
    vincentUniswapSwapToolIpfsCid: string,
    vincentSpendingLimitPolicyIpfsCid: string,
    litNetwork = 'datil'
): Promise<PKPInfo> => {
    // Create ethers provider and owner wallet
    const provider = new ethers.providers.JsonRpcProvider(YELLOWSTONE_RPC_URL);
    const pkpOwnerWallet = new ethers.Wallet(pkpOwnerPrivateKey as string, provider);

    const litContractClient = new LitContracts({
        signer: pkpOwnerWallet,
        network: LIT_NETWORK[litNetwork as keyof typeof LIT_NETWORK] || LIT_NETWORK.Datil,
    });
    await litContractClient.connect();

    const mintPkpTx = await litContractClient.pkpHelperContract.write.mintNextAndAddAuthMethods(
        AUTH_METHOD_TYPE.EthWallet,
        [AUTH_METHOD_TYPE.EthWallet, AUTH_METHOD_TYPE.LitAction, AUTH_METHOD_TYPE.LitAction, AUTH_METHOD_TYPE.LitAction],
        [
            pkpOwnerWallet.address,
            `0x${Buffer.from(
                ethers.utils.base58.decode(
                    vincentErc20ApprovalToolIpfsCid
                )
            ).toString("hex")}`,
            `0x${Buffer.from(
                ethers.utils.base58.decode(
                    vincentUniswapSwapToolIpfsCid
                )
            ).toString("hex")}`,
            `0x${Buffer.from(
                ethers.utils.base58.decode(
                    vincentSpendingLimitPolicyIpfsCid
                )
            ).toString("hex")}`
        ],
        ["0x", "0x", "0x", "0x"],
        [[AUTH_METHOD_SCOPE.SignAnything], [AUTH_METHOD_SCOPE.SignAnything], [AUTH_METHOD_SCOPE.SignAnything], [AUTH_METHOD_SCOPE.SignAnything]],
        true, // addPkpEthAddressAsPermittedAddress
        false, // sendPkpToItself
        { value: await litContractClient.pkpNftContract.read.mintCost() }
    );
    const mintPkpReceipt = await mintPkpTx.wait();

    const pkpMintedEvent = mintPkpReceipt!.events!.find(
        (event) =>
            event.topics[0] ===
            "0x3b2cc0657d0387a736293d66389f78e4c8025e413c7a1ee67b7707d4418c46b8"
    );

    const publicKey = "0x" + pkpMintedEvent!.data.slice(130, 260);
    const tokenId = ethers.utils.keccak256(publicKey);
    const ethAddress = await litContractClient.pkpNftContract.read.getEthAddress(
        tokenId
    );

    console.log(`ℹ️  Minted PKP owner: ${await litContractClient.pkpNftContract.read.ownerOf(tokenId)}`);

    return {
        tokenId: ethers.BigNumber.from(tokenId).toString(),
        publicKey,
        ethAddress,
    };
};
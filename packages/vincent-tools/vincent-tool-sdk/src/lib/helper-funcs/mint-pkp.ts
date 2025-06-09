import { type BigNumberish, type BytesLike, ethers } from 'ethers';
import { LIT_NETWORK, RPC_URL_BY_NETWORK } from '@lit-protocol/constants';
import { LitContracts } from '@lit-protocol/contracts-sdk';

export interface MintPkpParams {
  pkpOwnerPrivateKey: string;
  keyType: BigNumberish;
  permittedAuthMethodTypes: BigNumberish[];
  permittedAuthMethodIds: BytesLike[];
  permittedAuthMethodPubkeys: BytesLike[];
  permittedAuthMethodScopes: BigNumberish[][];
  addPkpEthAddressAsPermittedAddress: boolean;
  sendPkpToItself: boolean;
}

export const mintPkp = async ({
  pkpOwnerPrivateKey,
  keyType,
  permittedAuthMethodTypes,
  permittedAuthMethodIds,
  permittedAuthMethodPubkeys,
  permittedAuthMethodScopes,
  addPkpEthAddressAsPermittedAddress,
  sendPkpToItself,
}: MintPkpParams) => {
  const provider = new ethers.providers.StaticJsonRpcProvider(
    RPC_URL_BY_NETWORK[LIT_NETWORK.Datil],
  );
  const pkpOwnerWallet = new ethers.Wallet(pkpOwnerPrivateKey as string, provider);

  const nativeTokenBalance = await provider.getBalance(pkpOwnerWallet.address);
  if (nativeTokenBalance.isZero()) {
    throw new Error(
      `Address ${pkpOwnerWallet.address} has no Lit test token balance on Chronicle Yellowstone to mint an Agent Wallet PKP. Please fund it with Lit test tokens using the faucet: https://chronicle-yellowstone-faucet.getlit.dev/`,
    );
  }

  const litContractClient = new LitContracts({
    signer: pkpOwnerWallet,
    network: LIT_NETWORK.Datil,
  });
  await litContractClient.connect();

  const mintPkpTx = await litContractClient.pkpHelperContract.write.mintNextAndAddAuthMethods(
    keyType,
    permittedAuthMethodTypes,
    permittedAuthMethodIds,
    permittedAuthMethodPubkeys,
    permittedAuthMethodScopes,
    addPkpEthAddressAsPermittedAddress,
    sendPkpToItself,
    { value: await litContractClient.pkpNftContract.read.mintCost() },
  );

  const mintPkpReceipt = await mintPkpTx.wait();

  const pkpMintedEvent = mintPkpReceipt!.events!.find(
    (event) =>
      event.topics[0] === '0x3b2cc0657d0387a736293d66389f78e4c8025e413c7a1ee67b7707d4418c46b8',
  );

  const publicKey = '0x' + pkpMintedEvent!.data.slice(130, 260);
  const tokenId = ethers.utils.keccak256(publicKey);
  const ethAddress = await litContractClient.pkpNftContract.read.getEthAddress(tokenId);

  return {
    tokenId: ethers.BigNumber.from(tokenId).toString(),
    publicKey,
    ethAddress,
  };
};

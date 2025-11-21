import { ethers } from 'ethers';

import { AUTH_METHOD_TYPE, AUTH_METHOD_SCOPE } from '@lit-protocol/constants';

import { getLitContractsClient } from './litContractsClient/get-lit-contract-client';

export type PkpInfo = { ethAddress: string; tokenId: string };

/**
 * Helper function to mint a new PKP and return its information
 * @param wallet wallet that will be the PKP owner and permitted auth method
 * @returns the newly minted PKP's tokenId and ethAddress
 */
export const mintNewPkp = async ({ wallet }: { wallet: ethers.Wallet }): Promise<PkpInfo> => {
  const litContractClient = await getLitContractsClient({ wallet });

  const mintPkpTx = await litContractClient.pkpHelperContract.write.mintNextAndAddAuthMethods(
    AUTH_METHOD_TYPE.EthWallet,
    [AUTH_METHOD_TYPE.EthWallet],
    [wallet.address],
    ['0x'],
    [[AUTH_METHOD_SCOPE.SignAnything]],
    true, // addPkpEthAddressAsPermittedAddress
    false, // sendPkpToItself
    { value: await litContractClient.pkpNftContract.read.mintCost() },
  );

  const mintPkpReceipt = await mintPkpTx.wait();

  if (!mintPkpReceipt.events) {
    throw new Error('Mint Pkp Receipt does not have events');
  }

  const pkpMintedEvent = mintPkpReceipt.events.find(
    (event) =>
      event.topics[0] === '0x3b2cc0657d0387a736293d66389f78e4c8025e413c7a1ee67b7707d4418c46b8',
  );

  if (!pkpMintedEvent) {
    throw new Error(
      'Mint Pkp Receipt does not have PkpMinted event; cannot identify minted PKPs publicKey',
    );
  }

  const tokenId = ethers.utils.keccak256('0x' + pkpMintedEvent.data.slice(130, 260));
  const ethAddress = await litContractClient.pkpNftContract.read.getEthAddress(tokenId);

  console.log(`ℹ️  Minted new PKP owned by ${wallet.address} with ethAddress: ${ethAddress}`);

  return {
    tokenId: ethers.BigNumber.from(tokenId).toString(),
    ethAddress,
  };
};

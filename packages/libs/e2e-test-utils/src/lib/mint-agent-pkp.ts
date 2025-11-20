import { ethers } from 'ethers';

import { AUTH_METHOD_TYPE, AUTH_METHOD_SCOPE } from '@lit-protocol/constants';

import { getLitContractsClient } from './litContractsClient/get-lit-contract-client';
import type { PkpInfo } from './mint-new-pkp';

/**
 * Helper function to mint a new Agent PKP that is owned by a User Platform PKP
 * @param wallet wallet that will pay for the minting transaction (should be the EOA that owns the User Platform PKP)
 * @param userPlatformPkpInfo the User Platform PKP that will own the newly minted Agent PKP
 * @returns the newly minted Agent PKP's tokenId and ethAddress
 */
export const mintAgentPkp = async ({
  wallet,
  userPlatformPkpInfo,
}: {
  wallet: ethers.Wallet;
  userPlatformPkpInfo: PkpInfo;
}): Promise<PkpInfo> => {
  const litContractClient = await getLitContractsClient({ wallet });

  console.log(
    `ℹ️  Minting new Agent PKP owned by User Platform PKP ${userPlatformPkpInfo.ethAddress} (tokenId: ${userPlatformPkpInfo.tokenId})...`,
  );

  // Mint a PKP with the User Platform PKP as the auth method
  // AUTH_METHOD_TYPE 2 = PKP (not EthWallet which is 1)
  const mintPkpTx = await litContractClient.pkpHelperContract.write.mintNextAndAddAuthMethods(
    2, // AUTH_METHOD_TYPE.PKP (value is 2)
    [2], // permittedAuthMethodTypes - PKP type
    [userPlatformPkpInfo.tokenId], // permittedAuthMethodIds - User Platform PKP's token ID
    ['0x'], // permittedAuthMethodPubkeys - not used for PKP-to-PKP
    [[AUTH_METHOD_SCOPE.SignAnything]], // permittedAuthMethodScopes
    true, // addPkpEthAddressAsPermittedAddress - allow the new PKP's eth address to use it
    false, // sendPkpToItself - don't send to the new PKP itself
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

  console.log(
    `ℹ️  Minted new Agent PKP owned by User Platform PKP ${userPlatformPkpInfo.ethAddress} with ethAddress: ${ethAddress}, tokenId: ${tokenId}`,
  );

  // Now transfer ownership of the newly minted PKP to the User Platform PKP's eth address
  // This ensures that only the User Platform PKP can manage permissions for this Agent PKP
  const transferTx = await litContractClient.pkpNftContract.write.transferFrom(
    wallet.address,
    userPlatformPkpInfo.ethAddress,
    tokenId,
  );
  await transferTx.wait();

  console.log(
    `ℹ️  Transferred Agent PKP ${ethAddress} ownership to User Platform PKP ${userPlatformPkpInfo.ethAddress}`,
  );

  return {
    tokenId: ethers.BigNumber.from(tokenId).toString(),
    ethAddress,
  };
};

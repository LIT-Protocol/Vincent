import { LitContracts } from '@lit-protocol/contracts-sdk';
import { LIT_NETWORK } from '@lit-protocol/constants';
import { ethers } from 'ethers';

export const checkPkpHasPermittedIpfsCids = async ({
  pkpTokenId,
  vincentToolAndPolicyIpfsCids,
}: {
  pkpTokenId: string;
  vincentToolAndPolicyIpfsCids: string[];
}) => {
  const vincentToolAndPolicyIpfsCidsFormatted = vincentToolAndPolicyIpfsCids.map(
    (ipfsCid) => `0x${Buffer.from(ethers.utils.base58.decode(ipfsCid)).toString('hex')}`,
  );

  const litContractClient = new LitContracts({
    network: LIT_NETWORK.Datil,
  });
  await litContractClient.connect();
  const permittedLitActions =
    await litContractClient.pkpPermissionsContractUtils.read.getPermittedActions(pkpTokenId);

  const missingIpfsCids = vincentToolAndPolicyIpfsCidsFormatted.filter(
    (ipfsCid) => !permittedLitActions.includes(ipfsCid),
  );
  const missingIpfsCidsFormatted = missingIpfsCids.map((ipfsCid) =>
    ethers.utils.base58.encode(Buffer.from(ipfsCid.slice(2), 'hex')),
  );
  if (missingIpfsCids.length > 0) {
    throw new Error(
      `Agent Wallet PKP with token ID: ${pkpTokenId} does not have the required Vincent Tools and Policies as permitted Auth Methods: ${missingIpfsCidsFormatted.join(', ')}. Please add these IPFS CIDs to the Agent Wallet PKP using the Lit SDK: https://developer.litprotocol.com/user-wallets/pkps/advanced-topics/auth-methods/add-remove-auth-methods#add-an-auth-method`,
    );
  }
};

import { ethers } from 'ethers';
import { LitContracts } from '@lit-protocol/contracts-sdk';
import { LIT_NETWORK } from '@lit-protocol/constants';

export interface PkpInfo {
  tokenId: string;
  ethAddress: string;
  publicKey: string;
}

export const getPkpInfo = async ({
  pkpEthAddress,
  pkpTokenId,
  pkpPublicKey,
}: {
  pkpEthAddress?: string;
  pkpTokenId?: string;
  pkpPublicKey?: string;
}): Promise<PkpInfo> => {
  const litContractClient = new LitContracts({ network: LIT_NETWORK.Datil });
  await litContractClient.connect();

  if (pkpEthAddress) {
    const pkpTokenId =
      await litContractClient.pubkeyRouterContract.read.ethAddressToPkpId(pkpEthAddress);
    const publicKey = await litContractClient.pubkeyRouterContract.read.getPubkey(pkpTokenId);

    return {
      tokenId: pkpTokenId.toString(),
      ethAddress: ethers.utils.getAddress(pkpEthAddress),
      publicKey,
    };
  } else if (pkpTokenId) {
    const [ethAddress, publicKey] = await Promise.all([
      litContractClient.pkpNftContract.read.getEthAddress(pkpTokenId),
      litContractClient.pubkeyRouterContract.read.getPubkey(pkpTokenId),
    ]);

    return {
      tokenId: pkpTokenId,
      ethAddress,
      publicKey,
    };
  } else if (pkpPublicKey) {
    const tokenId = ethers.utils.keccak256(pkpPublicKey);

    return {
      tokenId,
      ethAddress: await litContractClient.pkpNftContract.read.getEthAddress(tokenId),
      publicKey: pkpPublicKey,
    };
  } else {
    throw new Error(
      'No PKP info provided, please provide either pkpEthAddress, pkpTokenId, or pkpPublicKey',
    );
  }
};

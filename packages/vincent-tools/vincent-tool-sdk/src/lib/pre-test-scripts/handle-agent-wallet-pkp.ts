import { AUTH_METHOD_SCOPE, AUTH_METHOD_TYPE } from '@lit-protocol/constants';
import { type BigNumber, type BigNumberish, ethers } from 'ethers';

import { getEnv, getPkpInfo, mintPkp, type PkpInfo } from '../helper-funcs';

// TODO If not minting PKP, check for IPFS CIDs as Auth Methods
export const handleAgentWalletPkp = async ({
  vincentToolAndPolicyIpfsCids,
}: {
  vincentToolAndPolicyIpfsCids?: string[];
}) => {
  try {
    const { pkpInfo, mintedNewPkp } = await getPkpInfoOrMint(vincentToolAndPolicyIpfsCids);

    const pkpInfoString = [
      mintedNewPkp
        ? [
            `Minted new Agent Wallet PKP.`,
            'Set the following environment variables to use this Agent Wallet PKP:',
          ]
        : `Using existing Agent Wallet PKP.`,
      `AGENT_WALLET_PKP_ETH_ADDRESS=${pkpInfo.ethAddress}`,
      `AGENT_WALLET_PKP_TOKEN_ID=${pkpInfo.tokenId}`,
      `AGENT_WALLET_PKP_PUBLIC_KEY=${pkpInfo.publicKey}`,
    ]
      .filter(Boolean)
      .join('\n');

    console.log(pkpInfoString);

    return { pkpInfo, mintedNewPkp };
  } catch (error) {
    console.error(
      `There was an error when trying to retrieve the Agent Wallet PKP info:`,
      error instanceof Error ? error.message : 'Unknown error',
    );
    process.exit(1);
  }
};

const getPkpInfoOrMint = async (vincentToolAndPolicyIpfsCids?: string[]) => {
  let pkpInfo: PkpInfo;
  let mintedNewPkp = false;

  try {
    pkpInfo = await getPkpFromEnv();
  } catch (error) {
    if (
      !(error instanceof Error) ||
      !error.message.includes('No Agent Wallet PKP identifier found in environment variables')
    ) {
      throw error;
    }

    pkpInfo = await _mintPkp(vincentToolAndPolicyIpfsCids);
    mintedNewPkp = true;
  }

  return {
    pkpInfo,
    mintedNewPkp,
  };
};

const getPkpFromEnv = async (): Promise<PkpInfo> => {
  const candidates: Array<{
    envVar: string;
    getInfo: (identifier: string) => Promise<PkpInfo>;
  }> = [
    {
      envVar: 'AGENT_WALLET_PKP_ETH_ADDRESS',
      getInfo: (identifier) => getPkpInfo({ pkpEthAddress: identifier }),
    },
    {
      envVar: 'AGENT_WALLET_PKP_TOKEN_ID',
      getInfo: (identifier) => getPkpInfo({ pkpTokenId: identifier }),
    },
    {
      envVar: 'AGENT_WALLET_PKP_PUBLIC_KEY',
      getInfo: (identifier) => getPkpInfo({ pkpPublicKey: identifier }),
    },
  ];

  for (const { envVar, getInfo } of candidates) {
    try {
      const identifier = getEnv(envVar);
      return await getInfo(identifier);
    } catch (error) {
      if (error instanceof Error && error.message.includes('is not set')) {
        continue;
      }
      throw error;
    }
  }

  throw new Error(
    'No Agent Wallet PKP identifier found in environment variables. Please set one of the following: AGENT_WALLET_PKP_ETH_ADDRESS, AGENT_WALLET_PKP_TOKEN_ID, AGENT_WALLET_PKP_PUBLIC_KEY',
  );
};

const _mintPkp = async (vincentToolAndPolicyIpfsCids?: string[]) => {
  const pkpOwnerPrivateKey = getEnv('AGENT_WALLET_PKP_OWNER_PRIVATE_KEY');
  const pkpOwnerWallet = new ethers.Wallet(pkpOwnerPrivateKey);

  const permittedAuthMethodTypes: BigNumberish[] = [AUTH_METHOD_TYPE.EthWallet];
  const permittedAuthMethodIds = [pkpOwnerWallet.address];
  const permittedAuthMethodPubkeys = ['0x'];
  const permittedAuthMethodScopes: BigNumberish[][] = [[AUTH_METHOD_SCOPE.SignAnything]];

  for (const ipfsCid of vincentToolAndPolicyIpfsCids ?? []) {
    permittedAuthMethodTypes.push(AUTH_METHOD_TYPE.LitAction);
    permittedAuthMethodIds.push(
      `0x${Buffer.from(ethers.utils.base58.decode(ipfsCid)).toString('hex')}`,
    );
    permittedAuthMethodPubkeys.push('0x');
    permittedAuthMethodScopes.push([AUTH_METHOD_SCOPE.SignAnything]);
  }

  const pkpInfo = await mintPkp({
    pkpOwnerPrivateKey,
    keyType: AUTH_METHOD_TYPE.EthWallet,
    permittedAuthMethodTypes,
    permittedAuthMethodIds,
    permittedAuthMethodPubkeys,
    permittedAuthMethodScopes,
    addPkpEthAddressAsPermittedAddress: true,
    sendPkpToItself: false,
  });

  return pkpInfo;
};

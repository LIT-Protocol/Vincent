import { AUTH_METHOD_SCOPE, AUTH_METHOD_TYPE } from '@lit-protocol/constants';
import { type BigNumberish, ethers } from 'ethers';

import {
  checkPkpHasPermittedIpfsCids,
  getEnv,
  getPkpInfo,
  mintPkp,
  type PkpInfo,
} from '../helper-funcs';

export const handleAgentWalletPkp = async ({
  vincentToolAndPolicyIpfsCids,
}: {
  vincentToolAndPolicyIpfsCids?: string[];
}) => {
  try {
    const { pkpInfo, mintedNewPkp } = await getPkpInfoOrMint(vincentToolAndPolicyIpfsCids);

    const pkpInfoString = [
      mintedNewPkp
        ? 'Minted new Agent Wallet PKP. Set the following environment variables to use this Agent Wallet PKP:'
        : `Using existing Agent Wallet PKP:`,
      `TEST_VINCENT_AGENT_WALLET_PKP_ETH_ADDRESS=${pkpInfo.ethAddress}`,
      `TEST_VINCENT_AGENT_WALLET_PKP_TOKEN_ID=${pkpInfo.tokenId}`,
      `TEST_VINCENT_AGENT_WALLET_PKP_PUBLIC_KEY=${pkpInfo.publicKey}`,
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

    if (vincentToolAndPolicyIpfsCids !== undefined) {
      await checkPkpHasPermittedIpfsCids({
        pkpTokenId: pkpInfo.tokenId,
        vincentToolAndPolicyIpfsCids,
      });
    }
  } catch (error) {
    if (
      !(error instanceof Error) ||
      !error.message.includes('No Agent Wallet PKP identifier found in environment variables') ||
      !error.message.includes(
        'does not have the required Vincent Tools and Policies as permitted Auth Methods',
      )
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
      envVar: 'TEST_VINCENT_AGENT_WALLET_PKP_ETH_ADDRESS',
      getInfo: (identifier) => getPkpInfo({ pkpEthAddress: identifier }),
    },
    {
      envVar: 'TEST_VINCENT_AGENT_WALLET_PKP_TOKEN_ID',
      getInfo: (identifier) => getPkpInfo({ pkpTokenId: identifier }),
    },
    {
      envVar: 'TEST_VINCENT_AGENT_WALLET_PKP_PUBLIC_KEY',
      getInfo: (identifier) => getPkpInfo({ pkpPublicKey: identifier }),
    },
  ];

  for (const { envVar, getInfo } of candidates) {
    const identifier = getEnv(envVar);
    if (identifier === undefined) {
      continue;
    }

    return await getInfo(identifier);
  }

  throw new Error(
    'No Agent Wallet PKP identifier found in environment variables. Please set one of the following: TEST_VINCENT_AGENT_WALLET_PKP_ETH_ADDRESS, TEST_VINCENT_AGENT_WALLET_PKP_TOKEN_ID, TEST_VINCENT_AGENT_WALLET_PKP_PUBLIC_KEY',
  );
};

const _mintPkp = async (vincentToolAndPolicyIpfsCids?: string[]) => {
  const pkpOwnerPrivateKey = getEnv('TEST_VINCENT_AGENT_WALLET_PKP_OWNER_PRIVATE_KEY');
  if (pkpOwnerPrivateKey === undefined) {
    console.error(
      'TEST_VINCENT_AGENT_WALLET_PKP_OWNER_PRIVATE_KEY environment variable is not set. Please set it to the private key that should own the Agent Wallet PKP.',
    );
    process.exit(1);
  }

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

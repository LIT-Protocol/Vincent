import { AUTH_METHOD_SCOPE, AUTH_METHOD_TYPE } from '@lit-protocol/constants';
import { type BigNumberish, ethers } from 'ethers';

import {
  checkPkpHasPermittedIpfsCids,
  checkVincentAppVersionPermitted,
  getEnv,
  getPkpInfo,
  mintPkp,
  permitVincentAppVersion,
  unpermitVincentAppVersion,
  type PkpInfo,
  type VincentToolWithValues,
} from '../helper-funcs';

export const handleAgentWalletPkp = async ({
  vincentToolsWithValues,
}: {
  vincentToolsWithValues: VincentToolWithValues[];
}) => {
  const { pkpInfo, mintedNewPkp } = await getPkpInfoOrMint(vincentToolsWithValues);

  const pkpInfoString = [
    mintedNewPkp
      ? 'ℹ️  Minted new Agent Wallet PKP. Set the following environment variables to use this Agent Wallet PKP:'
      : `ℹ️  Using existing Agent Wallet PKP:`,
    `TEST_VINCENT_AGENT_WALLET_PKP_ETH_ADDRESS=${pkpInfo.ethAddress}`,
    `TEST_VINCENT_AGENT_WALLET_PKP_TOKEN_ID=${pkpInfo.tokenId}`,
    `TEST_VINCENT_AGENT_WALLET_PKP_PUBLIC_KEY=${pkpInfo.publicKey}`,
  ]
    .filter(Boolean)
    .join('\n');
  console.log(pkpInfoString);

  await _permitVincentAppVersion({
    pkpTokenId: pkpInfo.tokenId,
    vincentToolsWithValues,
  });

  return { pkpInfo, mintedNewPkp };
};

const extractIpfsCidsFromToolsWithValues = (
  vincentToolsWithValues: VincentToolWithValues[],
): string[] => {
  const ipfsCids: string[] = [];

  for (const tool of vincentToolsWithValues) {
    // Add tool IPFS CID
    ipfsCids.push(tool.ipfsCid);

    // Add all policy IPFS CIDs
    for (const policy of tool.policies) {
      ipfsCids.push(policy.ipfsCid);
    }
  }

  return ipfsCids;
};

const getPkpInfoOrMint = async (vincentToolsWithValues: VincentToolWithValues[]) => {
  let mintedNewPkp = false;
  let pkpInfo = await getPkpInfoFromEnv();

  if (pkpInfo === null) {
    pkpInfo = await _mintPkp(vincentToolsWithValues);
    mintedNewPkp = true;
  } else {
    if (vincentToolsWithValues !== undefined) {
      // Extract all IPFS CIDs from tools and policies
      const vincentToolAndPolicyIpfsCids =
        extractIpfsCidsFromToolsWithValues(vincentToolsWithValues);
      await checkPkpHasPermittedIpfsCids({
        pkpTokenId: pkpInfo.tokenId,
        vincentToolAndPolicyIpfsCids,
      });
    }
  }

  return {
    pkpInfo,
    mintedNewPkp,
  };
};

export const getPkpInfoFromEnv = async (): Promise<PkpInfo | null> => {
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

  return null;
};

const _mintPkp = async (vincentToolsWithValues: VincentToolWithValues[]) => {
  const TEST_VINCENT_AGENT_WALLET_PKP_OWNER_PRIVATE_KEY = getEnv(
    'TEST_VINCENT_AGENT_WALLET_PKP_OWNER_PRIVATE_KEY',
  );
  if (TEST_VINCENT_AGENT_WALLET_PKP_OWNER_PRIVATE_KEY === undefined) {
    console.error(
      '❌ TEST_VINCENT_AGENT_WALLET_PKP_OWNER_PRIVATE_KEY environment variable is not set. Please set it to the private key that should own the Agent Wallet PKP.',
    );
    process.exit(1);
  }

  const pkpOwnerWallet = new ethers.Wallet(TEST_VINCENT_AGENT_WALLET_PKP_OWNER_PRIVATE_KEY);

  const permittedAuthMethodTypes: BigNumberish[] = [AUTH_METHOD_TYPE.EthWallet];
  const permittedAuthMethodIds = [pkpOwnerWallet.address];
  const permittedAuthMethodPubkeys = ['0x'];
  const permittedAuthMethodScopes: BigNumberish[][] = [[AUTH_METHOD_SCOPE.SignAnything]];

  // Extract IPFS CIDs and add them as permitted auth methods
  const vincentToolAndPolicyIpfsCids = extractIpfsCidsFromToolsWithValues(vincentToolsWithValues);
  for (const ipfsCid of vincentToolAndPolicyIpfsCids) {
    permittedAuthMethodTypes.push(AUTH_METHOD_TYPE.LitAction);
    permittedAuthMethodIds.push(
      `0x${Buffer.from(ethers.utils.base58.decode(ipfsCid)).toString('hex')}`,
    );
    permittedAuthMethodPubkeys.push('0x');
    permittedAuthMethodScopes.push([AUTH_METHOD_SCOPE.SignAnything]);
  }

  const pkpInfo = await mintPkp({
    pkpOwnerPrivateKey: TEST_VINCENT_AGENT_WALLET_PKP_OWNER_PRIVATE_KEY,
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

const _permitVincentAppVersion = async ({
  pkpTokenId,
  vincentToolsWithValues,
}: {
  pkpTokenId: string;
  vincentToolsWithValues: VincentToolWithValues[];
}) => {
  const TEST_VINCENT_AGENT_WALLET_PKP_OWNER_PRIVATE_KEY = getEnv(
    'TEST_VINCENT_AGENT_WALLET_PKP_OWNER_PRIVATE_KEY',
  );
  if (TEST_VINCENT_AGENT_WALLET_PKP_OWNER_PRIVATE_KEY === undefined) {
    console.error(
      '❌ TEST_VINCENT_AGENT_WALLET_PKP_OWNER_PRIVATE_KEY environment variable is not set. Please set it to the private key that should own the Agent Wallet PKP.',
    );
    process.exit(1);
  }

  const TEST_VINCENT_APP_ID = getEnv('TEST_VINCENT_APP_ID');
  if (TEST_VINCENT_APP_ID === undefined) {
    console.error(
      '❌ TEST_VINCENT_APP_ID environment variable is not set. Please set it to the ID of the Vincent App to permit.',
    );
    process.exit(1);
  }

  const TEST_VINCENT_APP_VERSION = getEnv('TEST_VINCENT_APP_VERSION');
  if (TEST_VINCENT_APP_VERSION === undefined) {
    console.error(
      '❌ TEST_VINCENT_APP_VERSION environment variable is not set. Please set it to the version of the Vincent App to permit.',
    );
    process.exit(1);
  }

  const { isPermitted, permittedAppVersion } = await checkVincentAppVersionPermitted({
    pkpTokenId,
    appId: Number(TEST_VINCENT_APP_ID),
    appVersion: Number(TEST_VINCENT_APP_VERSION),
  });

  if (isPermitted) {
    if (permittedAppVersion === Number(TEST_VINCENT_APP_VERSION)) {
      console.log(
        `ℹ️  Agent Wallet PKP with token id ${pkpTokenId} has already permitted Vincent App ID ${TEST_VINCENT_APP_ID} Version ${permittedAppVersion}`,
      );
      return;
    }

    console.error(
      `⚠️  Agent Wallet PKP with token id ${pkpTokenId} has already permitted Vincent App ID ${TEST_VINCENT_APP_ID} Version ${permittedAppVersion} but the current version is ${TEST_VINCENT_APP_VERSION}. Unpermitting the current version and permitting the new version...`,
    );
    const { txHash: unpermitTxHash } = await unpermitVincentAppVersion({
      pkpTokenId,
      appId: Number(TEST_VINCENT_APP_ID),
      appVersion: permittedAppVersion,
      pkpOwnerPrivateKey: TEST_VINCENT_AGENT_WALLET_PKP_OWNER_PRIVATE_KEY,
    });
    console.log(
      `ℹ️  Unpermitted Vincent App ID ${TEST_VINCENT_APP_ID} Version ${permittedAppVersion} for Agent Wallet PKP with token id ${pkpTokenId} with tx hash ${unpermitTxHash}`,
    );
  }

  const { txHash } = await permitVincentAppVersion({
    pkpTokenId,
    appId: Number(TEST_VINCENT_APP_ID),
    appVersion: Number(TEST_VINCENT_APP_VERSION),
    vincentToolsWithValues,
    pkpOwnerPrivateKey: TEST_VINCENT_AGENT_WALLET_PKP_OWNER_PRIVATE_KEY,
  });

  console.log(
    `ℹ️  Permitted Vincent App ID ${TEST_VINCENT_APP_ID} Version ${TEST_VINCENT_APP_VERSION} for Agent Wallet PKP with token id ${pkpTokenId} with tx hash ${txHash}`,
  );
};

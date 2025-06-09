import { AUTH_METHOD_SCOPE, AUTH_METHOD_TYPE } from '@lit-protocol/constants';
import { type BigNumberish, ethers } from 'ethers';

import {
  checkPkpHasPermittedIpfsCids,
  checkVincentAppVersionPermitted,
  checkVincentDelegateeCanExecuteTool,
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
  vincentAppDelegateeAddresses,
}: {
  vincentToolsWithValues?: VincentToolWithValues[];
  vincentAppDelegateeAddresses?: string[];
}) => {
  try {
    const { pkpInfo, mintedNewPkp } = await getPkpInfoOrMint(vincentToolsWithValues);

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

    await _permitVincentAppVersion({
      pkpTokenId: pkpInfo.tokenId,
      vincentToolsWithValues: vincentToolsWithValues || [],
    });

    // if (vincentAppDelegateeAddresses !== undefined) {
    //     await _checkVincentDelegateeCanExecuteTool({
    //         pkpTokenId: ethers.BigNumber.from(pkpInfo.tokenId),
    //         vincentToolIpfsCids: extractIpfsCidsFromToolsWithValues(vincentToolsWithValues || []),
    //         vincentAppDelegateeAddresses,
    //     });
    // }

    return { pkpInfo, mintedNewPkp };
  } catch (error) {
    console.error(
      `There was an error when processing the Agent Wallet PKP:`,
      error instanceof Error ? error.message : 'Unknown error',
    );
    process.exit(1);
  }
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

const getPkpInfoOrMint = async (vincentToolsWithValues?: VincentToolWithValues[]) => {
  let pkpInfo: PkpInfo;
  let mintedNewPkp = false;

  try {
    pkpInfo = await getPkpFromEnv();

    if (vincentToolsWithValues !== undefined) {
      // Extract all IPFS CIDs from tools and policies
      const vincentToolAndPolicyIpfsCids =
        extractIpfsCidsFromToolsWithValues(vincentToolsWithValues);
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

    pkpInfo = await _mintPkp(vincentToolsWithValues);
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

const _mintPkp = async (vincentToolsWithValues?: VincentToolWithValues[]) => {
  const TEST_VINCENT_AGENT_WALLET_PKP_OWNER_PRIVATE_KEY = getEnv(
    'TEST_VINCENT_AGENT_WALLET_PKP_OWNER_PRIVATE_KEY',
  );
  if (TEST_VINCENT_AGENT_WALLET_PKP_OWNER_PRIVATE_KEY === undefined) {
    console.error(
      'TEST_VINCENT_AGENT_WALLET_PKP_OWNER_PRIVATE_KEY environment variable is not set. Please set it to the private key that should own the Agent Wallet PKP.',
    );
    process.exit(1);
  }

  const pkpOwnerWallet = new ethers.Wallet(TEST_VINCENT_AGENT_WALLET_PKP_OWNER_PRIVATE_KEY);

  const permittedAuthMethodTypes: BigNumberish[] = [AUTH_METHOD_TYPE.EthWallet];
  const permittedAuthMethodIds = [pkpOwnerWallet.address];
  const permittedAuthMethodPubkeys = ['0x'];
  const permittedAuthMethodScopes: BigNumberish[][] = [[AUTH_METHOD_SCOPE.SignAnything]];

  // Extract IPFS CIDs and add them as permitted auth methods
  const vincentToolAndPolicyIpfsCids = extractIpfsCidsFromToolsWithValues(
    vincentToolsWithValues || [],
  );
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
      'TEST_VINCENT_AGENT_WALLET_PKP_OWNER_PRIVATE_KEY environment variable is not set. Please set it to the private key that should own the Agent Wallet PKP.',
    );
    process.exit(1);
  }

  const TEST_VINCENT_APP_ID = getEnv('TEST_VINCENT_APP_ID');
  if (TEST_VINCENT_APP_ID === undefined) {
    console.error(
      'TEST_VINCENT_APP_ID environment variable is not set. Please set it to the ID of the Vincent App to permit.',
    );
    process.exit(1);
  }

  const TEST_VINCENT_APP_VERSION = getEnv('TEST_VINCENT_APP_VERSION');
  if (TEST_VINCENT_APP_VERSION === undefined) {
    console.error(
      'TEST_VINCENT_APP_VERSION environment variable is not set. Please set it to the version of the Vincent App to permit.',
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
        `Agent Wallet PKP with token id ${pkpTokenId} has already permitted Vincent App ID ${TEST_VINCENT_APP_ID} Version ${permittedAppVersion}`,
      );
      return;
    }

    console.error(
      `Agent Wallet PKP with token id ${pkpTokenId} has already permitted Vincent App ID ${TEST_VINCENT_APP_ID} Version ${permittedAppVersion} but the current version is ${TEST_VINCENT_APP_VERSION}. Unpermitting the current version and permitting the new version...`,
    );
    const { txHash: unpermitTxHash } = await unpermitVincentAppVersion({
      pkpTokenId,
      appId: Number(TEST_VINCENT_APP_ID),
      appVersion: permittedAppVersion,
      pkpOwnerPrivateKey: TEST_VINCENT_AGENT_WALLET_PKP_OWNER_PRIVATE_KEY,
    });
    console.log(
      `Unpermitted Vincent App ID ${TEST_VINCENT_APP_ID} Version ${permittedAppVersion} for Agent Wallet PKP with token id ${pkpTokenId} with tx hash ${unpermitTxHash}`,
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
    `Permitted Vincent App ID ${TEST_VINCENT_APP_ID} Version ${TEST_VINCENT_APP_VERSION} for Agent Wallet PKP with token id ${pkpTokenId} with tx hash ${txHash}`,
  );
};

// @ts-expect-error TODO Fix call revert error
const _checkVincentDelegateeCanExecuteTool = async ({
  pkpTokenId,
  vincentToolIpfsCids,
  vincentAppDelegateeAddresses,
}: {
  pkpTokenId: ethers.BigNumber;
  vincentToolIpfsCids: string[];
  vincentAppDelegateeAddresses: string[];
}) => {
  const unpermittedCombinations: { delegatee: string; tool: string }[] = [];

  for (const toolIpfsCid of vincentToolIpfsCids) {
    for (const vincentAppDelegateeAddress of vincentAppDelegateeAddresses) {
      const { isPermitted } = await checkVincentDelegateeCanExecuteTool({
        delegateeAddress: vincentAppDelegateeAddress,
        pkpTokenId,
        toolIpfsCid,
      });

      if (!isPermitted) {
        unpermittedCombinations.push({
          delegatee: vincentAppDelegateeAddress,
          tool: toolIpfsCid,
        });
      }
    }
  }

  if (unpermittedCombinations.length > 0) {
    console.error(
      `PKP token id ${pkpTokenId} has the following unpermitted delegatee/tool combinations:`,
    );
    unpermittedCombinations.forEach(({ delegatee, tool }) => {
      console.error(`  - Delegatee ${delegatee} cannot execute tool ${tool}`);
    });
    process.exit(1);
  }

  console.log(
    `All delegatees have permission to execute all tools with PKP token id ${pkpTokenId}`,
  );
};

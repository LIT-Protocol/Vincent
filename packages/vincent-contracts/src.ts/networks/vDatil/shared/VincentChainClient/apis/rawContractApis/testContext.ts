import { Account, createWalletClient, http, parseEther } from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { vincentMainnetNetworkContext } from '../../../../datil-mainnet/vincentContext';
import { createVincentNetworkContext } from '../../NetworkContextManager';
import { registerApp } from './VincentAppFacet/registerApp';
import { ParameterTypeInput, PolicyParameterValues } from './VincentAppFacet/schemas/ParameterType';

export const getTestContext = async (opts?: {
  registerApp?: boolean;
  jit?: boolean;
}) => {
  const jit = opts?.jit || process.env.TEST_ENABLE_JIT === 'true';

  const masterTestPrivateKey = process.env.TEST_PRIVATE_KEY as `0x${string}`;

  if (!masterTestPrivateKey) {
    throw new Error('❌ TEST_PRIVATE_KEY is not set');
  }

  let jitTestAccount: Account | undefined = undefined;

  let networkContext;

  const masterTestAccount = privateKeyToAccount(masterTestPrivateKey);

  if (jit) {
    jitTestAccount = privateKeyToAccount(generatePrivateKey());

    const masterWalletClient = createWalletClient({
      account: masterTestAccount,
      chain: vincentMainnetNetworkContext.chainConfig.chain,
      transport: http(vincentMainnetNetworkContext.rpcUrl),
    });

    const hash = await masterWalletClient.sendTransaction({
      to: jitTestAccount.address,
      value: parseEther('0.00001'), // 0.001 ETH
    });

    console.log('🔥 [getTestContext > JIT] Hash:', hash);
    networkContext = createVincentNetworkContext({
      accountOrWalletClient: jitTestAccount,
      network: 'datil',
    });
  } else {
    networkContext = createVincentNetworkContext({
      accountOrWalletClient: masterTestAccount,
      network: 'datil',
    });
  }

  const randomDelegateeAccount = privateKeyToAccount(generatePrivateKey());

  const config = {
    // register app
    APP_NAME: 'Test App',
    APP_DESCRIPTION: 'Test Description',
    AUTHORIZED_REDIRECT_URIS: ['http://localhost:3000'],
    DELEGATEES: [randomDelegateeAccount.address],
    TOOL_IPFS_CIDS: ['QmUT4Ke8cPtJYRZiWrkoG9RZc77hmRETNQjvDYfLtrMUEY'],
    TOOL_POLICIES: [['QmcLbQPohPURMuNdhYYa6wyDp9pm6eHPdHv9TRgFkPVebE']],
    TOOL_POLICY_PARAMETER_NAMES: [
      [
        ['param1'],
        ['param2'],
        ['param3'],
        ['param4'],
        ['param5'],
        ['param6'],
        ['param7'],
        ['param8'],
        ['param9'],
        ['param10'],
        ['param11'],
        ['param12'],
      ],
    ],
    TOOL_POLICY_PARAMETER_TYPES: [
      [
        [
          'INT256',
          'INT256_ARRAY',
          'UINT256',
          'UINT256_ARRAY',
          'BOOL',
          'BOOL_ARRAY',
          'ADDRESS',
          'ADDRESS_ARRAY',
          'STRING',
          'STRING_ARRAY',
          'BYTES',
          'BYTES_ARRAY',
        ],
      ],
    ] as ParameterTypeInput[][][],
    TOOL_POLICY_PARAMETER_VALUES: [
      [
        [{ type: 'int256', value: '-1000000000000000000' }], // INT256
        [{ type: 'int256[]', value: '-1000000000000000000,2000000000000000000' }], // INT256_ARRAY
        [{ type: 'uint256', value: '1000000000000000000' }], // UINT256
        [{ type: 'uint256[]', value: '1000000000000000000,2000000000000000000' }], // UINT256_ARRAY
        [{ type: 'bool', value: 'true' }], // BOOL
        [{ type: 'bool[]', value: 'true,false,true' }], // BOOL_ARRAY
        [{ type: 'address', value: '0x1234567890123456789012345678901234567890' }], // ADDRESS
        [{ type: 'address[]', value: '0x1234567890123456789012345678901234567890,0x0987654321098765432109876543210987654321' }], // ADDRESS_ARRAY
        [{ type: 'string', value: 'Hello World' }], // STRING
        [{ type: 'string[]', value: 'Hello,World' }], // STRING_ARRAY
        [{ type: 'bytes', value: '0x1234' }], // BYTES
        [{ type: 'bytes[]', value: '0x1234,0x5678' }], // BYTES_ARRAY
      ],
    ] as PolicyParameterValues,
    // approving (random ipfs cids)
    TOOL_IPFS_CIDS_TO_APPROVE: [
      'QmWxywr4ASXzr68NapmoHteaTCparjnBT7Y3u9PrYajxAA',
      'QmYuXmjBMdzCg9ZnR5Dwv4hLG96k87mbbThVbP1wStgLwS',
    ],

    // registering agent pkps
    AGENT_PKP_TOKEN_IDS: [
      // master test account minted pkp from https://explorer.litprotocol.com/
      114562664564785842901296348187980577675304156440915274165810734947906810777263n,
    ],

    failCase: {
      nonExistentAddress: '0x1234567890123456789012345678901234567890',
      nonExistentAppId: 999999,
    },
  };

  let appId: bigint;
  let managerAddress: `0x${string}`;
  let registerAppRes;

  if (opts?.registerApp) {
    registerAppRes = await registerApp(
      {
        appName: config.APP_NAME,
        appDescription: config.APP_DESCRIPTION,
        authorizedRedirectUris: config.AUTHORIZED_REDIRECT_URIS,
        delegatees: config.DELEGATEES,
        toolIpfsCids: config.TOOL_IPFS_CIDS,
        toolPolicies: config.TOOL_POLICIES,
        toolPolicyParameterNames: config.TOOL_POLICY_PARAMETER_NAMES,
        toolPolicyParameterTypes: config.TOOL_POLICY_PARAMETER_TYPES,
      },
      networkContext,
    );

    appId = registerAppRes.decodedLogs.find(
      (log) => log.eventName === 'NewAppVersionRegistered',
    )?.args.appId;
    managerAddress = registerAppRes.decodedLogs.find(
      (log) => log.eventName === 'NewAppRegistered',
    )?.args.manager;
    console.log('[getTestContext] Created app with ID:', appId);
    console.log('[getTestContext] Manager address:', managerAddress);
  }

  return {
    ...config,
    registerAppRes: {
      res: registerAppRes,
      appId: appId!,
      managerAddress: managerAddress!,
    },
    networkContext,
  };
};

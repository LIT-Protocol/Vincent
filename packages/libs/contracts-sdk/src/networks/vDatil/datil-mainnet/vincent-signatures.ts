/**
 * Generated Contract Method Signatures for Vincent SDK
 * This file is auto-generated. DO NOT EDIT UNLESS YOU KNOW WHAT YOU'RE DOING.
 */

export const vincentDiamondAddress = '0xa1979393bbe7D59dfFBEB38fE5eCf9BDdFE6f4aD';

export const vincentSignatures = {
  VincentAppViewFacet: {
    address: '0x0ae827019c8ca0d87567676cfe5c66dacfbd0d1c',
    methods: {
      getAppByDelegatee: {
        type: 'function',
        name: 'getAppByDelegatee',
        inputs: [
          {
            name: 'delegatee',
            type: 'address',
            internalType: 'address',
          },
        ],
        outputs: [
          {
            name: 'app',
            type: 'tuple',
            internalType: 'struct VincentAppViewFacet.App',
            components: [
              {
                name: 'id',
                type: 'uint256',
                internalType: 'uint256',
              },
              {
                name: 'isDeleted',
                type: 'bool',
                internalType: 'bool',
              },
              {
                name: 'manager',
                type: 'address',
                internalType: 'address',
              },
              {
                name: 'latestVersion',
                type: 'uint256',
                internalType: 'uint256',
              },
              {
                name: 'delegatees',
                type: 'address[]',
                internalType: 'address[]',
              },
            ],
          },
        ],
        stateMutability: 'view',
      },
      getAppById: {
        type: 'function',
        name: 'getAppById',
        inputs: [
          {
            name: 'appId',
            type: 'uint256',
            internalType: 'uint256',
          },
        ],
        outputs: [
          {
            name: 'app',
            type: 'tuple',
            internalType: 'struct VincentAppViewFacet.App',
            components: [
              {
                name: 'id',
                type: 'uint256',
                internalType: 'uint256',
              },
              {
                name: 'isDeleted',
                type: 'bool',
                internalType: 'bool',
              },
              {
                name: 'manager',
                type: 'address',
                internalType: 'address',
              },
              {
                name: 'latestVersion',
                type: 'uint256',
                internalType: 'uint256',
              },
              {
                name: 'delegatees',
                type: 'address[]',
                internalType: 'address[]',
              },
            ],
          },
        ],
        stateMutability: 'view',
      },
      getAppVersion: {
        type: 'function',
        name: 'getAppVersion',
        inputs: [
          {
            name: 'appId',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'version',
            type: 'uint256',
            internalType: 'uint256',
          },
        ],
        outputs: [
          {
            name: 'app',
            type: 'tuple',
            internalType: 'struct VincentAppViewFacet.App',
            components: [
              {
                name: 'id',
                type: 'uint256',
                internalType: 'uint256',
              },
              {
                name: 'isDeleted',
                type: 'bool',
                internalType: 'bool',
              },
              {
                name: 'manager',
                type: 'address',
                internalType: 'address',
              },
              {
                name: 'latestVersion',
                type: 'uint256',
                internalType: 'uint256',
              },
              {
                name: 'delegatees',
                type: 'address[]',
                internalType: 'address[]',
              },
            ],
          },
          {
            name: 'appVersion',
            type: 'tuple',
            internalType: 'struct VincentAppViewFacet.AppVersion',
            components: [
              {
                name: 'version',
                type: 'uint256',
                internalType: 'uint256',
              },
              {
                name: 'enabled',
                type: 'bool',
                internalType: 'bool',
              },
              {
                name: 'delegatedAgentPkpTokenIds',
                type: 'uint256[]',
                internalType: 'uint256[]',
              },
              {
                name: 'tools',
                type: 'tuple[]',
                internalType: 'struct VincentAppViewFacet.Tool[]',
                components: [
                  {
                    name: 'toolIpfsCid',
                    type: 'string',
                    internalType: 'string',
                  },
                  {
                    name: 'policyIpfsCids',
                    type: 'string[]',
                    internalType: 'string[]',
                  },
                ],
              },
            ],
          },
        ],
        stateMutability: 'view',
      },
      getAppsByManager: {
        type: 'function',
        name: 'getAppsByManager',
        inputs: [
          {
            name: 'manager',
            type: 'address',
            internalType: 'address',
          },
        ],
        outputs: [
          {
            name: 'appsWithVersions',
            type: 'tuple[]',
            internalType: 'struct VincentAppViewFacet.AppWithVersions[]',
            components: [
              {
                name: 'app',
                type: 'tuple',
                internalType: 'struct VincentAppViewFacet.App',
                components: [
                  {
                    name: 'id',
                    type: 'uint256',
                    internalType: 'uint256',
                  },
                  {
                    name: 'isDeleted',
                    type: 'bool',
                    internalType: 'bool',
                  },
                  {
                    name: 'manager',
                    type: 'address',
                    internalType: 'address',
                  },
                  {
                    name: 'latestVersion',
                    type: 'uint256',
                    internalType: 'uint256',
                  },
                  {
                    name: 'delegatees',
                    type: 'address[]',
                    internalType: 'address[]',
                  },
                ],
              },
              {
                name: 'versions',
                type: 'tuple[]',
                internalType: 'struct VincentAppViewFacet.AppVersion[]',
                components: [
                  {
                    name: 'version',
                    type: 'uint256',
                    internalType: 'uint256',
                  },
                  {
                    name: 'enabled',
                    type: 'bool',
                    internalType: 'bool',
                  },
                  {
                    name: 'delegatedAgentPkpTokenIds',
                    type: 'uint256[]',
                    internalType: 'uint256[]',
                  },
                  {
                    name: 'tools',
                    type: 'tuple[]',
                    internalType: 'struct VincentAppViewFacet.Tool[]',
                    components: [
                      {
                        name: 'toolIpfsCid',
                        type: 'string',
                        internalType: 'string',
                      },
                      {
                        name: 'policyIpfsCids',
                        type: 'string[]',
                        internalType: 'string[]',
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
        stateMutability: 'view',
      },
      getDelegatedAgentPkpTokenIds: {
        type: 'function',
        name: 'getDelegatedAgentPkpTokenIds',
        inputs: [
          {
            name: 'appId',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'version',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'offset',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'limit',
            type: 'uint256',
            internalType: 'uint256',
          },
        ],
        outputs: [
          {
            name: 'delegatedAgentPkpTokenIds',
            type: 'uint256[]',
            internalType: 'uint256[]',
          },
        ],
        stateMutability: 'view',
      },
    },
    events: [],
    errors: [
      {
        type: 'error',
        name: 'AppHasBeenDeleted',
        inputs: [
          {
            name: 'appId',
            type: 'uint256',
            internalType: 'uint256',
          },
        ],
      },
      {
        type: 'error',
        name: 'AppNotRegistered',
        inputs: [
          {
            name: 'appId',
            type: 'uint256',
            internalType: 'uint256',
          },
        ],
      },
      {
        type: 'error',
        name: 'AppVersionNotEnabled',
        inputs: [
          {
            name: 'appId',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'appVersion',
            type: 'uint256',
            internalType: 'uint256',
          },
        ],
      },
      {
        type: 'error',
        name: 'AppVersionNotRegistered',
        inputs: [
          {
            name: 'appId',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'appVersion',
            type: 'uint256',
            internalType: 'uint256',
          },
        ],
      },
      {
        type: 'error',
        name: 'DelegateeNotRegistered',
        inputs: [
          {
            name: 'delegatee',
            type: 'address',
            internalType: 'address',
          },
        ],
      },
      {
        type: 'error',
        name: 'InvalidOffsetOrLimit',
        inputs: [],
      },
      {
        type: 'error',
        name: 'NoAppsFoundForManager',
        inputs: [
          {
            name: 'manager',
            type: 'address',
            internalType: 'address',
          },
        ],
      },
      {
        type: 'error',
        name: 'ZeroAddressNotAllowed',
        inputs: [],
      },
    ],
  },
  VincentUserViewFacet: {
    address: '0xc615853170c05d24b58a72d588bf282fed5d2c3b',
    methods: {
      getAllPermittedAppIdsForPkp: {
        type: 'function',
        name: 'getAllPermittedAppIdsForPkp',
        inputs: [
          {
            name: 'pkpTokenId',
            type: 'uint256',
            internalType: 'uint256',
          },
        ],
        outputs: [
          {
            name: '',
            type: 'uint256[]',
            internalType: 'uint256[]',
          },
        ],
        stateMutability: 'view',
      },
      getAllRegisteredAgentPkps: {
        type: 'function',
        name: 'getAllRegisteredAgentPkps',
        inputs: [
          {
            name: 'userAddress',
            type: 'address',
            internalType: 'address',
          },
        ],
        outputs: [
          {
            name: '',
            type: 'uint256[]',
            internalType: 'uint256[]',
          },
        ],
        stateMutability: 'view',
      },
      getAllToolsAndPoliciesForApp: {
        type: 'function',
        name: 'getAllToolsAndPoliciesForApp',
        inputs: [
          {
            name: 'pkpTokenId',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'appId',
            type: 'uint256',
            internalType: 'uint256',
          },
        ],
        outputs: [
          {
            name: 'tools',
            type: 'tuple[]',
            internalType: 'struct VincentUserViewFacet.ToolWithPolicies[]',
            components: [
              {
                name: 'toolIpfsCid',
                type: 'string',
                internalType: 'string',
              },
              {
                name: 'policies',
                type: 'tuple[]',
                internalType: 'struct VincentUserViewFacet.PolicyWithParameters[]',
                components: [
                  {
                    name: 'policyIpfsCid',
                    type: 'string',
                    internalType: 'string',
                  },
                  {
                    name: 'policyParameterValues',
                    type: 'bytes',
                    internalType: 'bytes',
                  },
                ],
              },
            ],
          },
        ],
        stateMutability: 'view',
      },
      getPermittedAppVersionForPkp: {
        type: 'function',
        name: 'getPermittedAppVersionForPkp',
        inputs: [
          {
            name: 'pkpTokenId',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'appId',
            type: 'uint256',
            internalType: 'uint256',
          },
        ],
        outputs: [
          {
            name: '',
            type: 'uint256',
            internalType: 'uint256',
          },
        ],
        stateMutability: 'view',
      },
      validateToolExecutionAndGetPolicies: {
        type: 'function',
        name: 'validateToolExecutionAndGetPolicies',
        inputs: [
          {
            name: 'delegatee',
            type: 'address',
            internalType: 'address',
          },
          {
            name: 'pkpTokenId',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'toolIpfsCid',
            type: 'string',
            internalType: 'string',
          },
        ],
        outputs: [
          {
            name: 'validation',
            type: 'tuple',
            internalType: 'struct VincentUserViewFacet.ToolExecutionValidation',
            components: [
              {
                name: 'isPermitted',
                type: 'bool',
                internalType: 'bool',
              },
              {
                name: 'appId',
                type: 'uint256',
                internalType: 'uint256',
              },
              {
                name: 'appVersion',
                type: 'uint256',
                internalType: 'uint256',
              },
              {
                name: 'policies',
                type: 'tuple[]',
                internalType: 'struct VincentUserViewFacet.PolicyWithParameters[]',
                components: [
                  {
                    name: 'policyIpfsCid',
                    type: 'string',
                    internalType: 'string',
                  },
                  {
                    name: 'policyParameterValues',
                    type: 'bytes',
                    internalType: 'bytes',
                  },
                ],
              },
            ],
          },
        ],
        stateMutability: 'view',
      },
    },
    events: [],
    errors: [
      {
        type: 'error',
        name: 'AppHasBeenDeleted',
        inputs: [
          {
            name: 'appId',
            type: 'uint256',
            internalType: 'uint256',
          },
        ],
      },
      {
        type: 'error',
        name: 'AppNotRegistered',
        inputs: [
          {
            name: 'appId',
            type: 'uint256',
            internalType: 'uint256',
          },
        ],
      },
      {
        type: 'error',
        name: 'AppVersionNotEnabled',
        inputs: [
          {
            name: 'appId',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'appVersion',
            type: 'uint256',
            internalType: 'uint256',
          },
        ],
      },
      {
        type: 'error',
        name: 'AppVersionNotRegistered',
        inputs: [
          {
            name: 'appId',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'appVersion',
            type: 'uint256',
            internalType: 'uint256',
          },
        ],
      },
      {
        type: 'error',
        name: 'DelegateeNotAssociatedWithApp',
        inputs: [
          {
            name: 'delegatee',
            type: 'address',
            internalType: 'address',
          },
        ],
      },
      {
        type: 'error',
        name: 'EmptyToolIpfsCid',
        inputs: [],
      },
      {
        type: 'error',
        name: 'InvalidAppId',
        inputs: [],
      },
      {
        type: 'error',
        name: 'InvalidPkpTokenId',
        inputs: [],
      },
      {
        type: 'error',
        name: 'NoRegisteredPkpsFound',
        inputs: [
          {
            name: 'userAddress',
            type: 'address',
            internalType: 'address',
          },
        ],
      },
      {
        type: 'error',
        name: 'PkpNotPermittedForAppVersion',
        inputs: [
          {
            name: 'pkpTokenId',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'appId',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'appVersion',
            type: 'uint256',
            internalType: 'uint256',
          },
        ],
      },
      {
        type: 'error',
        name: 'PolicyParameterNotSetForPkp',
        inputs: [
          {
            name: 'pkpTokenId',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'appId',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'appVersion',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'policyIpfsCid',
            type: 'string',
            internalType: 'string',
          },
          {
            name: 'parameterName',
            type: 'string',
            internalType: 'string',
          },
        ],
      },
      {
        type: 'error',
        name: 'ZeroAddressNotAllowed',
        inputs: [],
      },
    ],
  },
  VincentAppFacet: {
    address: '0xa7efa5fb04fdb04d1f31d9eb293ece85a3d50412',
    methods: {
      addDelegatee: {
        type: 'function',
        name: 'addDelegatee',
        inputs: [
          {
            name: 'appId',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'delegatee',
            type: 'address',
            internalType: 'address',
          },
        ],
        outputs: [],
        stateMutability: 'nonpayable',
      },
      deleteApp: {
        type: 'function',
        name: 'deleteApp',
        inputs: [
          {
            name: 'appId',
            type: 'uint256',
            internalType: 'uint256',
          },
        ],
        outputs: [],
        stateMutability: 'nonpayable',
      },
      enableAppVersion: {
        type: 'function',
        name: 'enableAppVersion',
        inputs: [
          {
            name: 'appId',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'appVersion',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'enabled',
            type: 'bool',
            internalType: 'bool',
          },
        ],
        outputs: [],
        stateMutability: 'nonpayable',
      },
      registerApp: {
        type: 'function',
        name: 'registerApp',
        inputs: [
          {
            name: 'appId',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'delegatees',
            type: 'address[]',
            internalType: 'address[]',
          },
          {
            name: 'versionTools',
            type: 'tuple',
            internalType: 'struct VincentAppFacet.AppVersionTools',
            components: [
              {
                name: 'toolIpfsCids',
                type: 'string[]',
                internalType: 'string[]',
              },
              {
                name: 'toolPolicies',
                type: 'string[][]',
                internalType: 'string[][]',
              },
            ],
          },
        ],
        outputs: [
          {
            name: 'newAppVersion',
            type: 'uint256',
            internalType: 'uint256',
          },
        ],
        stateMutability: 'nonpayable',
      },
      registerNextAppVersion: {
        type: 'function',
        name: 'registerNextAppVersion',
        inputs: [
          {
            name: 'appId',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'versionTools',
            type: 'tuple',
            internalType: 'struct VincentAppFacet.AppVersionTools',
            components: [
              {
                name: 'toolIpfsCids',
                type: 'string[]',
                internalType: 'string[]',
              },
              {
                name: 'toolPolicies',
                type: 'string[][]',
                internalType: 'string[][]',
              },
            ],
          },
        ],
        outputs: [
          {
            name: 'newAppVersion',
            type: 'uint256',
            internalType: 'uint256',
          },
        ],
        stateMutability: 'nonpayable',
      },
      removeDelegatee: {
        type: 'function',
        name: 'removeDelegatee',
        inputs: [
          {
            name: 'appId',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'delegatee',
            type: 'address',
            internalType: 'address',
          },
        ],
        outputs: [],
        stateMutability: 'nonpayable',
      },
      undeleteApp: {
        type: 'function',
        name: 'undeleteApp',
        inputs: [
          {
            name: 'appId',
            type: 'uint256',
            internalType: 'uint256',
          },
        ],
        outputs: [],
        stateMutability: 'nonpayable',
      },
    },
    events: [
      {
        type: 'event',
        name: 'AppDeleted',
        inputs: [
          {
            name: 'appId',
            type: 'uint256',
            indexed: true,
            internalType: 'uint256',
          },
        ],
        anonymous: false,
      },
      {
        type: 'event',
        name: 'AppEnabled',
        inputs: [
          {
            name: 'appId',
            type: 'uint256',
            indexed: true,
            internalType: 'uint256',
          },
          {
            name: 'appVersion',
            type: 'uint256',
            indexed: true,
            internalType: 'uint256',
          },
          {
            name: 'enabled',
            type: 'bool',
            indexed: true,
            internalType: 'bool',
          },
        ],
        anonymous: false,
      },
      {
        type: 'event',
        name: 'AppUndeleted',
        inputs: [
          {
            name: 'appId',
            type: 'uint256',
            indexed: true,
            internalType: 'uint256',
          },
        ],
        anonymous: false,
      },
      {
        type: 'event',
        name: 'DelegateeAdded',
        inputs: [
          {
            name: 'appId',
            type: 'uint256',
            indexed: true,
            internalType: 'uint256',
          },
          {
            name: 'delegatee',
            type: 'address',
            indexed: true,
            internalType: 'address',
          },
        ],
        anonymous: false,
      },
      {
        type: 'event',
        name: 'DelegateeRemoved',
        inputs: [
          {
            name: 'appId',
            type: 'uint256',
            indexed: true,
            internalType: 'uint256',
          },
          {
            name: 'delegatee',
            type: 'address',
            indexed: true,
            internalType: 'address',
          },
        ],
        anonymous: false,
      },
      {
        type: 'event',
        name: 'NewAppRegistered',
        inputs: [
          {
            name: 'appId',
            type: 'uint256',
            indexed: true,
            internalType: 'uint256',
          },
          {
            name: 'manager',
            type: 'address',
            indexed: true,
            internalType: 'address',
          },
        ],
        anonymous: false,
      },
      {
        type: 'event',
        name: 'NewAppVersionRegistered',
        inputs: [
          {
            name: 'appId',
            type: 'uint256',
            indexed: true,
            internalType: 'uint256',
          },
          {
            name: 'appVersion',
            type: 'uint256',
            indexed: true,
            internalType: 'uint256',
          },
          {
            name: 'manager',
            type: 'address',
            indexed: true,
            internalType: 'address',
          },
        ],
        anonymous: false,
      },
      {
        type: 'event',
        name: 'NewLitActionRegistered',
        inputs: [
          {
            name: 'litActionIpfsCidHash',
            type: 'bytes32',
            indexed: true,
            internalType: 'bytes32',
          },
        ],
        anonymous: false,
      },
    ],
    errors: [
      {
        type: 'error',
        name: 'AppAlreadyDeleted',
        inputs: [
          {
            name: 'appId',
            type: 'uint256',
            internalType: 'uint256',
          },
        ],
      },
      {
        type: 'error',
        name: 'AppAlreadyRegistered',
        inputs: [
          {
            name: 'appId',
            type: 'uint256',
            internalType: 'uint256',
          },
        ],
      },
      {
        type: 'error',
        name: 'AppAlreadyUndeleted',
        inputs: [
          {
            name: 'appId',
            type: 'uint256',
            internalType: 'uint256',
          },
        ],
      },
      {
        type: 'error',
        name: 'AppHasBeenDeleted',
        inputs: [
          {
            name: 'appId',
            type: 'uint256',
            internalType: 'uint256',
          },
        ],
      },
      {
        type: 'error',
        name: 'AppNotRegistered',
        inputs: [
          {
            name: 'appId',
            type: 'uint256',
            internalType: 'uint256',
          },
        ],
      },
      {
        type: 'error',
        name: 'AppVersionAlreadyInRequestedState',
        inputs: [
          {
            name: 'appId',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'appVersion',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'enabled',
            type: 'bool',
            internalType: 'bool',
          },
        ],
      },
      {
        type: 'error',
        name: 'AppVersionNotEnabled',
        inputs: [
          {
            name: 'appId',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'appVersion',
            type: 'uint256',
            internalType: 'uint256',
          },
        ],
      },
      {
        type: 'error',
        name: 'AppVersionNotRegistered',
        inputs: [
          {
            name: 'appId',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'appVersion',
            type: 'uint256',
            internalType: 'uint256',
          },
        ],
      },
      {
        type: 'error',
        name: 'DelegateeAlreadyRegisteredToApp',
        inputs: [
          {
            name: 'appId',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'delegatee',
            type: 'address',
            internalType: 'address',
          },
        ],
      },
      {
        type: 'error',
        name: 'DelegateeNotRegisteredToApp',
        inputs: [
          {
            name: 'appId',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'delegatee',
            type: 'address',
            internalType: 'address',
          },
        ],
      },
      {
        type: 'error',
        name: 'DuplicateToolIpfsCidNotAllowed',
        inputs: [
          {
            name: 'appId',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'toolIndex',
            type: 'uint256',
            internalType: 'uint256',
          },
        ],
      },
      {
        type: 'error',
        name: 'DuplicateToolPolicyIpfsCidNotAllowed',
        inputs: [
          {
            name: 'appId',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'toolIndex',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'policyIndex',
            type: 'uint256',
            internalType: 'uint256',
          },
        ],
      },
      {
        type: 'error',
        name: 'EmptyPolicyIpfsCidNotAllowed',
        inputs: [
          {
            name: 'appId',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'toolIndex',
            type: 'uint256',
            internalType: 'uint256',
          },
        ],
      },
      {
        type: 'error',
        name: 'EmptyToolIpfsCidNotAllowed',
        inputs: [
          {
            name: 'appId',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'toolIndex',
            type: 'uint256',
            internalType: 'uint256',
          },
        ],
      },
      {
        type: 'error',
        name: 'NoToolsProvided',
        inputs: [
          {
            name: 'appId',
            type: 'uint256',
            internalType: 'uint256',
          },
        ],
      },
      {
        type: 'error',
        name: 'NotAppManager',
        inputs: [
          {
            name: 'appId',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'msgSender',
            type: 'address',
            internalType: 'address',
          },
        ],
      },
      {
        type: 'error',
        name: 'ToolArrayDimensionMismatch',
        inputs: [
          {
            name: 'toolsLength',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'policiesLength',
            type: 'uint256',
            internalType: 'uint256',
          },
        ],
      },
      {
        type: 'error',
        name: 'ZeroAddressDelegateeNotAllowed',
        inputs: [],
      },
      {
        type: 'error',
        name: 'ZeroAppIdNotAllowed',
        inputs: [],
      },
    ],
  },
  VincentUserFacet: {
    address: '0x1b1e6be91e6efbb7f0cdb07d7740bb0b7af629b5',
    methods: {
      permitAppVersion: {
        type: 'function',
        name: 'permitAppVersion',
        inputs: [
          {
            name: 'pkpTokenId',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'appId',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'appVersion',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'toolIpfsCids',
            type: 'string[]',
            internalType: 'string[]',
          },
          {
            name: 'policyIpfsCids',
            type: 'string[][]',
            internalType: 'string[][]',
          },
          {
            name: 'policyParameterValues',
            type: 'bytes[][]',
            internalType: 'bytes[][]',
          },
        ],
        outputs: [],
        stateMutability: 'nonpayable',
      },
      setToolPolicyParameters: {
        type: 'function',
        name: 'setToolPolicyParameters',
        inputs: [
          {
            name: 'pkpTokenId',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'appId',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'appVersion',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'toolIpfsCids',
            type: 'string[]',
            internalType: 'string[]',
          },
          {
            name: 'policyIpfsCids',
            type: 'string[][]',
            internalType: 'string[][]',
          },
          {
            name: 'policyParameterValues',
            type: 'bytes[][]',
            internalType: 'bytes[][]',
          },
        ],
        outputs: [],
        stateMutability: 'nonpayable',
      },
      unPermitAppVersion: {
        type: 'function',
        name: 'unPermitAppVersion',
        inputs: [
          {
            name: 'pkpTokenId',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'appId',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'appVersion',
            type: 'uint256',
            internalType: 'uint256',
          },
        ],
        outputs: [],
        stateMutability: 'nonpayable',
      },
    },
    events: [
      {
        type: 'event',
        name: 'AppVersionPermitted',
        inputs: [
          {
            name: 'pkpTokenId',
            type: 'uint256',
            indexed: true,
            internalType: 'uint256',
          },
          {
            name: 'appId',
            type: 'uint256',
            indexed: true,
            internalType: 'uint256',
          },
          {
            name: 'appVersion',
            type: 'uint256',
            indexed: true,
            internalType: 'uint256',
          },
        ],
        anonymous: false,
      },
      {
        type: 'event',
        name: 'AppVersionUnPermitted',
        inputs: [
          {
            name: 'pkpTokenId',
            type: 'uint256',
            indexed: true,
            internalType: 'uint256',
          },
          {
            name: 'appId',
            type: 'uint256',
            indexed: true,
            internalType: 'uint256',
          },
          {
            name: 'appVersion',
            type: 'uint256',
            indexed: true,
            internalType: 'uint256',
          },
        ],
        anonymous: false,
      },
      {
        type: 'event',
        name: 'NewUserAgentPkpRegistered',
        inputs: [
          {
            name: 'userAddress',
            type: 'address',
            indexed: true,
            internalType: 'address',
          },
          {
            name: 'pkpTokenId',
            type: 'uint256',
            indexed: true,
            internalType: 'uint256',
          },
        ],
        anonymous: false,
      },
      {
        type: 'event',
        name: 'ToolPolicyParametersSet',
        inputs: [
          {
            name: 'pkpTokenId',
            type: 'uint256',
            indexed: true,
            internalType: 'uint256',
          },
          {
            name: 'appId',
            type: 'uint256',
            indexed: true,
            internalType: 'uint256',
          },
          {
            name: 'appVersion',
            type: 'uint256',
            indexed: true,
            internalType: 'uint256',
          },
          {
            name: 'hashedToolIpfsCid',
            type: 'bytes32',
            indexed: false,
            internalType: 'bytes32',
          },
          {
            name: 'hashedToolPolicyIpfsCid',
            type: 'bytes32',
            indexed: false,
            internalType: 'bytes32',
          },
          {
            name: 'policyParameterValues',
            type: 'bytes',
            indexed: false,
            internalType: 'bytes',
          },
        ],
        anonymous: false,
      },
    ],
    errors: [
      {
        type: 'error',
        name: 'AppHasBeenDeleted',
        inputs: [
          {
            name: 'appId',
            type: 'uint256',
            internalType: 'uint256',
          },
        ],
      },
      {
        type: 'error',
        name: 'AppNotRegistered',
        inputs: [
          {
            name: 'appId',
            type: 'uint256',
            internalType: 'uint256',
          },
        ],
      },
      {
        type: 'error',
        name: 'AppVersionAlreadyPermitted',
        inputs: [
          {
            name: 'pkpTokenId',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'appId',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'appVersion',
            type: 'uint256',
            internalType: 'uint256',
          },
        ],
      },
      {
        type: 'error',
        name: 'AppVersionNotEnabled',
        inputs: [
          {
            name: 'appId',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'appVersion',
            type: 'uint256',
            internalType: 'uint256',
          },
        ],
      },
      {
        type: 'error',
        name: 'AppVersionNotPermitted',
        inputs: [
          {
            name: 'pkpTokenId',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'appId',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'appVersion',
            type: 'uint256',
            internalType: 'uint256',
          },
        ],
      },
      {
        type: 'error',
        name: 'AppVersionNotRegistered',
        inputs: [
          {
            name: 'appId',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'appVersion',
            type: 'uint256',
            internalType: 'uint256',
          },
        ],
      },
      {
        type: 'error',
        name: 'DuplicateToolIpfsCid',
        inputs: [
          {
            name: 'appId',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'appVersion',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'toolIpfsCid',
            type: 'string',
            internalType: 'string',
          },
        ],
      },
      {
        type: 'error',
        name: 'DuplicateToolPolicyIpfsCid',
        inputs: [
          {
            name: 'appId',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'appVersion',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'toolIpfsCid',
            type: 'string',
            internalType: 'string',
          },
          {
            name: 'toolPolicyIpfsCid',
            type: 'string',
            internalType: 'string',
          },
        ],
      },
      {
        type: 'error',
        name: 'EmptyPolicyIpfsCid',
        inputs: [],
      },
      {
        type: 'error',
        name: 'EmptyToolIpfsCid',
        inputs: [],
      },
      {
        type: 'error',
        name: 'InvalidInput',
        inputs: [],
      },
      {
        type: 'error',
        name: 'NotAllRegisteredToolsProvided',
        inputs: [
          {
            name: 'appId',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'appVersion',
            type: 'uint256',
            internalType: 'uint256',
          },
        ],
      },
      {
        type: 'error',
        name: 'NotPkpOwner',
        inputs: [
          {
            name: 'pkpTokenId',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'msgSender',
            type: 'address',
            internalType: 'address',
          },
        ],
      },
      {
        type: 'error',
        name: 'PkpTokenDoesNotExist',
        inputs: [
          {
            name: 'pkpTokenId',
            type: 'uint256',
            internalType: 'uint256',
          },
        ],
      },
      {
        type: 'error',
        name: 'PolicyArrayLengthMismatch',
        inputs: [
          {
            name: 'toolIndex',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'policiesLength',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'paramValuesLength',
            type: 'uint256',
            internalType: 'uint256',
          },
        ],
      },
      {
        type: 'error',
        name: 'ToolNotRegisteredForAppVersion',
        inputs: [
          {
            name: 'appId',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'appVersion',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'toolIpfsCid',
            type: 'string',
            internalType: 'string',
          },
        ],
      },
      {
        type: 'error',
        name: 'ToolPolicyNotRegisteredForAppVersion',
        inputs: [
          {
            name: 'appId',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'appVersion',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'toolIpfsCid',
            type: 'string',
            internalType: 'string',
          },
          {
            name: 'toolPolicyIpfsCid',
            type: 'string',
            internalType: 'string',
          },
        ],
      },
      {
        type: 'error',
        name: 'ToolsAndPoliciesLengthMismatch',
        inputs: [],
      },
      {
        type: 'error',
        name: 'ZeroPkpTokenId',
        inputs: [],
      },
    ],
  },
} as const;

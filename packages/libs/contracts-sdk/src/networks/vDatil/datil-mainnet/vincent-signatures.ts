/**
 * Generated Contract Method Signatures for Vincent SDK
 * This file is auto-generated. DO NOT EDIT UNLESS YOU KNOW WHAT YOU'RE DOING.
 */

export const vincentDiamondAddress = '0x78Cd1d270Ff12BA55e98BDff1f3646426E25D932';

export const vincentSignatures = {
  VincentLitActionFacet: {
    address: '0x317dcaf11816237da6e9dc42730fbca5c778adb8',
    methods: {
      approveLitActions: {
        type: 'function',
        name: 'approveLitActions',
        inputs: [
          {
            name: 'litActionIpfsCids',
            type: 'string[]',
            internalType: 'string[]',
          },
        ],
        outputs: [],
        stateMutability: 'nonpayable',
      },
      removeLitActionApprovals: {
        type: 'function',
        name: 'removeLitActionApprovals',
        inputs: [
          {
            name: 'litActionIpfsCids',
            type: 'string[]',
            internalType: 'string[]',
          },
        ],
        outputs: [],
        stateMutability: 'nonpayable',
      },
      updateApprovedLitActionsManager: {
        type: 'function',
        name: 'updateApprovedLitActionsManager',
        inputs: [
          {
            name: 'newManager',
            type: 'address',
            internalType: 'address',
          },
        ],
        outputs: [],
        stateMutability: 'nonpayable',
      },
    },
    events: [
      {
        type: 'event',
        name: 'ApprovedLitActionsManagerUpdated',
        inputs: [
          {
            name: 'previousManager',
            type: 'address',
            indexed: true,
            internalType: 'address',
          },
          {
            name: 'newManager',
            type: 'address',
            indexed: true,
            internalType: 'address',
          },
        ],
        anonymous: false,
      },
      {
        type: 'event',
        name: 'LitActionApprovalRemoved',
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
      {
        type: 'event',
        name: 'LitActionApproved',
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
        name: 'EmptyLitActionIpfsCid',
        inputs: [],
      },
      {
        type: 'error',
        name: 'EmptyLitActionIpfsCidsArray',
        inputs: [],
      },
      {
        type: 'error',
        name: 'InvalidApprovedLitActionsManager',
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
        name: 'LitActionAlreadyApproved',
        inputs: [
          {
            name: 'litActionIpfsCidHash',
            type: 'bytes32',
            internalType: 'bytes32',
          },
        ],
      },
      {
        type: 'error',
        name: 'LitActionAlreadyRegistered',
        inputs: [
          {
            name: 'litActionIpfsCidHash',
            type: 'bytes32',
            internalType: 'bytes32',
          },
        ],
      },
      {
        type: 'error',
        name: 'LitActionNotApproved',
        inputs: [
          {
            name: 'litActionIpfsCidHash',
            type: 'bytes32',
            internalType: 'bytes32',
          },
        ],
      },
      {
        type: 'error',
        name: 'LitActionNotRegistered',
        inputs: [
          {
            name: 'litActionIpfsCidHash',
            type: 'bytes32',
            internalType: 'bytes32',
          },
        ],
      },
      {
        type: 'error',
        name: 'NotApprovedLitActionsManager',
        inputs: [
          {
            name: 'caller',
            type: 'address',
            internalType: 'address',
          },
        ],
      },
    ],
  },
  VincentAppViewFacet: {
    address: '0xf38cd856b8b6d5dfb8cb4c19b16f4cd357dca50c',
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
                name: 'name',
                type: 'string',
                internalType: 'string',
              },
              {
                name: 'description',
                type: 'string',
                internalType: 'string',
              },
              {
                name: 'isDeleted',
                type: 'bool',
                internalType: 'bool',
              },
              {
                name: 'deploymentStatus',
                type: 'uint8',
                internalType: 'enum VincentAppStorage.DeploymentStatus',
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
              {
                name: 'authorizedRedirectUris',
                type: 'string[]',
                internalType: 'string[]',
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
                name: 'name',
                type: 'string',
                internalType: 'string',
              },
              {
                name: 'description',
                type: 'string',
                internalType: 'string',
              },
              {
                name: 'isDeleted',
                type: 'bool',
                internalType: 'bool',
              },
              {
                name: 'deploymentStatus',
                type: 'uint8',
                internalType: 'enum VincentAppStorage.DeploymentStatus',
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
              {
                name: 'authorizedRedirectUris',
                type: 'string[]',
                internalType: 'string[]',
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
                name: 'name',
                type: 'string',
                internalType: 'string',
              },
              {
                name: 'description',
                type: 'string',
                internalType: 'string',
              },
              {
                name: 'isDeleted',
                type: 'bool',
                internalType: 'bool',
              },
              {
                name: 'deploymentStatus',
                type: 'uint8',
                internalType: 'enum VincentAppStorage.DeploymentStatus',
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
              {
                name: 'authorizedRedirectUris',
                type: 'string[]',
                internalType: 'string[]',
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
                    name: 'policies',
                    type: 'tuple[]',
                    internalType: 'struct VincentAppViewFacet.Policy[]',
                    components: [
                      {
                        name: 'policyIpfsCid',
                        type: 'string',
                        internalType: 'string',
                      },
                      {
                        name: 'parameterNames',
                        type: 'string[]',
                        internalType: 'string[]',
                      },
                      {
                        name: 'parameterTypes',
                        type: 'uint8[]',
                        internalType: 'enum VincentAppStorage.ParameterType[]',
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
                    name: 'name',
                    type: 'string',
                    internalType: 'string',
                  },
                  {
                    name: 'description',
                    type: 'string',
                    internalType: 'string',
                  },
                  {
                    name: 'isDeleted',
                    type: 'bool',
                    internalType: 'bool',
                  },
                  {
                    name: 'deploymentStatus',
                    type: 'uint8',
                    internalType: 'enum VincentAppStorage.DeploymentStatus',
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
                  {
                    name: 'authorizedRedirectUris',
                    type: 'string[]',
                    internalType: 'string[]',
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
                        name: 'policies',
                        type: 'tuple[]',
                        internalType: 'struct VincentAppViewFacet.Policy[]',
                        components: [
                          {
                            name: 'policyIpfsCid',
                            type: 'string',
                            internalType: 'string',
                          },
                          {
                            name: 'parameterNames',
                            type: 'string[]',
                            internalType: 'string[]',
                          },
                          {
                            name: 'parameterTypes',
                            type: 'uint8[]',
                            internalType: 'enum VincentAppStorage.ParameterType[]',
                          },
                        ],
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
      getAuthorizedRedirectUriByHash: {
        type: 'function',
        name: 'getAuthorizedRedirectUriByHash',
        inputs: [
          {
            name: 'redirectUriHash',
            type: 'bytes32',
            internalType: 'bytes32',
          },
        ],
        outputs: [
          {
            name: 'redirectUri',
            type: 'string',
            internalType: 'string',
          },
        ],
        stateMutability: 'view',
      },
      getAuthorizedRedirectUrisByAppId: {
        type: 'function',
        name: 'getAuthorizedRedirectUrisByAppId',
        inputs: [
          {
            name: 'appId',
            type: 'uint256',
            internalType: 'uint256',
          },
        ],
        outputs: [
          {
            name: 'redirectUris',
            type: 'string[]',
            internalType: 'string[]',
          },
        ],
        stateMutability: 'view',
      },
      getTotalAppCount: {
        type: 'function',
        name: 'getTotalAppCount',
        inputs: [],
        outputs: [
          {
            name: '',
            type: 'uint256',
            internalType: 'uint256',
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
        name: 'NoAuthorizedRedirectUrisFoundForApp',
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
        name: 'RedirectUriNotFound',
        inputs: [
          {
            name: 'redirectUriHash',
            type: 'bytes32',
            internalType: 'bytes32',
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
    address: '0xe9513d17f0b26350007e52181c5090de44cc2382',
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
                    name: 'parameters',
                    type: 'tuple[]',
                    internalType: 'struct VincentUserViewFacet.PolicyParameter[]',
                    components: [
                      {
                        name: 'name',
                        type: 'string',
                        internalType: 'string',
                      },
                      {
                        name: 'paramType',
                        type: 'uint8',
                        internalType: 'enum VincentAppStorage.ParameterType',
                      },
                      {
                        name: 'value',
                        type: 'bytes',
                        internalType: 'bytes',
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
                    name: 'parameters',
                    type: 'tuple[]',
                    internalType: 'struct VincentUserViewFacet.PolicyParameter[]',
                    components: [
                      {
                        name: 'name',
                        type: 'string',
                        internalType: 'string',
                      },
                      {
                        name: 'paramType',
                        type: 'uint8',
                        internalType: 'enum VincentAppStorage.ParameterType',
                      },
                      {
                        name: 'value',
                        type: 'bytes',
                        internalType: 'bytes',
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
  VincentLitActionViewFacet: {
    address: '0x4464d6f15f6b98e9694da8ca8927c663896f3a8b',
    methods: {
      getAllApprovedLitActions: {
        type: 'function',
        name: 'getAllApprovedLitActions',
        inputs: [],
        outputs: [
          {
            name: 'litActionIpfsCids',
            type: 'string[]',
            internalType: 'string[]',
          },
        ],
        stateMutability: 'view',
      },
      getApprovedLitActionsManager: {
        type: 'function',
        name: 'getApprovedLitActionsManager',
        inputs: [],
        outputs: [
          {
            name: 'manager',
            type: 'address',
            internalType: 'address',
          },
        ],
        stateMutability: 'view',
      },
      getLitActionIpfsCidByHash: {
        type: 'function',
        name: 'getLitActionIpfsCidByHash',
        inputs: [
          {
            name: 'litActionIpfsCidHash',
            type: 'bytes32',
            internalType: 'bytes32',
          },
        ],
        outputs: [
          {
            name: '',
            type: 'string',
            internalType: 'string',
          },
        ],
        stateMutability: 'view',
      },
      isLitActionApproved: {
        type: 'function',
        name: 'isLitActionApproved',
        inputs: [
          {
            name: 'litActionIpfsCid',
            type: 'string',
            internalType: 'string',
          },
        ],
        outputs: [
          {
            name: 'isApproved',
            type: 'bool',
            internalType: 'bool',
          },
        ],
        stateMutability: 'view',
      },
    },
    events: [],
    errors: [
      {
        type: 'error',
        name: 'EmptyLitActionIpfsCid',
        inputs: [],
      },
      {
        type: 'error',
        name: 'LitActionHashNotFound',
        inputs: [
          {
            name: 'litActionIpfsCidHash',
            type: 'bytes32',
            internalType: 'bytes32',
          },
        ],
      },
      {
        type: 'error',
        name: 'NoLitActionsApproved',
        inputs: [],
      },
      {
        type: 'error',
        name: 'NoLitActionsRegistered',
        inputs: [],
      },
    ],
  },
  VincentAppFacet: {
    address: '0x13ff2a260be776569d45de32d0f11a0414454b88',
    methods: {
      addAuthorizedRedirectUri: {
        type: 'function',
        name: 'addAuthorizedRedirectUri',
        inputs: [
          {
            name: 'appId',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'redirectUri',
            type: 'string',
            internalType: 'string',
          },
        ],
        outputs: [],
        stateMutability: 'nonpayable',
      },
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
            name: 'appInfo',
            type: 'tuple',
            internalType: 'struct VincentAppFacet.AppInfo',
            components: [
              {
                name: 'name',
                type: 'string',
                internalType: 'string',
              },
              {
                name: 'description',
                type: 'string',
                internalType: 'string',
              },
              {
                name: 'deploymentStatus',
                type: 'uint8',
                internalType: 'enum VincentAppStorage.DeploymentStatus',
              },
              {
                name: 'authorizedRedirectUris',
                type: 'string[]',
                internalType: 'string[]',
              },
              {
                name: 'delegatees',
                type: 'address[]',
                internalType: 'address[]',
              },
            ],
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
              {
                name: 'toolPolicyParameterNames',
                type: 'string[][][]',
                internalType: 'string[][][]',
              },
              {
                name: 'toolPolicyParameterTypes',
                type: 'uint8[][][]',
                internalType: 'enum VincentAppStorage.ParameterType[][][]',
              },
            ],
          },
        ],
        outputs: [
          {
            name: 'newAppId',
            type: 'uint256',
            internalType: 'uint256',
          },
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
              {
                name: 'toolPolicyParameterNames',
                type: 'string[][][]',
                internalType: 'string[][][]',
              },
              {
                name: 'toolPolicyParameterTypes',
                type: 'uint8[][][]',
                internalType: 'enum VincentAppStorage.ParameterType[][][]',
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
      removeAuthorizedRedirectUri: {
        type: 'function',
        name: 'removeAuthorizedRedirectUri',
        inputs: [
          {
            name: 'appId',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'redirectUri',
            type: 'string',
            internalType: 'string',
          },
        ],
        outputs: [],
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
      updateAppDeploymentStatus: {
        type: 'function',
        name: 'updateAppDeploymentStatus',
        inputs: [
          {
            name: 'appId',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'deploymentStatus',
            type: 'uint8',
            internalType: 'enum VincentAppStorage.DeploymentStatus',
          },
        ],
        outputs: [],
        stateMutability: 'nonpayable',
      },
      updateAppDescription: {
        type: 'function',
        name: 'updateAppDescription',
        inputs: [
          {
            name: 'appId',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'newDescription',
            type: 'string',
            internalType: 'string',
          },
        ],
        outputs: [],
        stateMutability: 'nonpayable',
      },
      updateAppName: {
        type: 'function',
        name: 'updateAppName',
        inputs: [
          {
            name: 'appId',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'newName',
            type: 'string',
            internalType: 'string',
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
        name: 'AppDeploymentStatusUpdated',
        inputs: [
          {
            name: 'appId',
            type: 'uint256',
            indexed: true,
            internalType: 'uint256',
          },
          {
            name: 'deploymentStatus',
            type: 'uint8',
            indexed: true,
            internalType: 'uint8',
          },
        ],
        anonymous: false,
      },
      {
        type: 'event',
        name: 'AppDescriptionUpdated',
        inputs: [
          {
            name: 'appId',
            type: 'uint256',
            indexed: true,
            internalType: 'uint256',
          },
          {
            name: 'newDescription',
            type: 'string',
            indexed: false,
            internalType: 'string',
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
        name: 'AppNameUpdated',
        inputs: [
          {
            name: 'appId',
            type: 'uint256',
            indexed: true,
            internalType: 'uint256',
          },
          {
            name: 'newName',
            type: 'string',
            indexed: false,
            internalType: 'string',
          },
        ],
        anonymous: false,
      },
      {
        type: 'event',
        name: 'AuthorizedRedirectUriAdded',
        inputs: [
          {
            name: 'appId',
            type: 'uint256',
            indexed: true,
            internalType: 'uint256',
          },
          {
            name: 'hashedRedirectUri',
            type: 'bytes32',
            indexed: true,
            internalType: 'bytes32',
          },
        ],
        anonymous: false,
      },
      {
        type: 'event',
        name: 'AuthorizedRedirectUriRemoved',
        inputs: [
          {
            name: 'appId',
            type: 'uint256',
            indexed: true,
            internalType: 'uint256',
          },
          {
            name: 'hashedRedirectUri',
            type: 'bytes32',
            indexed: true,
            internalType: 'bytes32',
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
        name: 'AppAlreadyInRequestedDeploymentStatus',
        inputs: [
          {
            name: 'appId',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'deploymentStatus',
            type: 'uint8',
            internalType: 'uint8',
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
        name: 'AppVersionHasDelegatedAgents',
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
        name: 'CannotRemoveLastRedirectUri',
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
        name: 'EmptyAppDescriptionNotAllowed',
        inputs: [],
      },
      {
        type: 'error',
        name: 'EmptyAppNameNotAllowed',
        inputs: [],
      },
      {
        type: 'error',
        name: 'EmptyParameterNameNotAllowed',
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
          {
            name: 'paramIndex',
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
        name: 'EmptyRedirectUriNotAllowed',
        inputs: [],
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
        name: 'NoRedirectUrisProvided',
        inputs: [],
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
        name: 'ParameterArrayLengthMismatch',
        inputs: [
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
          {
            name: 'paramNamesLength',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'paramTypesLength',
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
            name: 'paramNamesLength',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'paramTypesLength',
            type: 'uint256',
            internalType: 'uint256',
          },
        ],
      },
      {
        type: 'error',
        name: 'RedirectUriAlreadyAuthorizedForApp',
        inputs: [
          {
            name: 'appId',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'redirectUri',
            type: 'string',
            internalType: 'string',
          },
        ],
      },
      {
        type: 'error',
        name: 'RedirectUriNotRegisteredToApp',
        inputs: [
          {
            name: 'appId',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'redirectUri',
            type: 'string',
            internalType: 'string',
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
          {
            name: 'paramNamesLength',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'paramTypesLength',
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
    ],
  },
  VincentUserFacet: {
    address: '0x10ba7711ca4f7f75fe7db7945bcf82b3b605f9cd',
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
            name: 'policyParameterNames',
            type: 'string[][][]',
            internalType: 'string[][][]',
          },
          {
            name: 'policyParameterValues',
            type: 'bytes[][][]',
            internalType: 'bytes[][][]',
          },
        ],
        outputs: [],
        stateMutability: 'nonpayable',
      },
      removeToolPolicyParameters: {
        type: 'function',
        name: 'removeToolPolicyParameters',
        inputs: [
          {
            name: 'appId',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'pkpTokenId',
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
            name: 'policyParameterNames',
            type: 'string[][][]',
            internalType: 'string[][][]',
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
            name: 'policyParameterNames',
            type: 'string[][][]',
            internalType: 'string[][][]',
          },
          {
            name: 'policyParameterValues',
            type: 'bytes[][][]',
            internalType: 'bytes[][][]',
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
        name: 'ToolPolicyParameterRemoved',
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
            name: 'hashedPolicyParameterName',
            type: 'bytes32',
            indexed: false,
            internalType: 'bytes32',
          },
        ],
        anonymous: false,
      },
      {
        type: 'event',
        name: 'ToolPolicyParameterSet',
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
            name: 'hashedPolicyParameterName',
            type: 'bytes32',
            indexed: false,
            internalType: 'bytes32',
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
        name: 'EmptyParameterName',
        inputs: [],
      },
      {
        type: 'error',
        name: 'EmptyParameterValue',
        inputs: [
          {
            name: 'parameterName',
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
        name: 'ParameterArrayLengthMismatch',
        inputs: [
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
          {
            name: 'paramNamesLength',
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
            name: 'paramNamesLength',
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
        name: 'PolicyParameterNameNotRegisteredForAppVersion',
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
          {
            name: 'policyParameterName',
            type: 'string',
            internalType: 'string',
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

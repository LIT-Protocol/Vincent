/**
 * Generated Contract Method Signatures for Vincent SDK
 * This file is auto-generated. DO NOT EDIT UNLESS YOU KNOW WHAT YOU'RE DOING.
 */

export const vincentDiamondAddress = '0x463f798049D300566686b5623Bb6b46c24e0faA9';

export const vincentSignatures = {
  "VincentLitActionFacet": {
    "address": "0xa813b35388a05268d8f577a767d777578593ec46",
    "methods": {
      "approveLitActions": {
        "type": "function",
        "name": "approveLitActions",
        "inputs": [
          {
            "name": "litActionIpfsCids",
            "type": "string[]",
            "internalType": "string[]"
          }
        ],
        "outputs": [],
        "stateMutability": "nonpayable"
      },
      "removeLitActionApprovals": {
        "type": "function",
        "name": "removeLitActionApprovals",
        "inputs": [
          {
            "name": "litActionIpfsCids",
            "type": "string[]",
            "internalType": "string[]"
          }
        ],
        "outputs": [],
        "stateMutability": "nonpayable"
      },
      "updateApprovedLitActionsManager": {
        "type": "function",
        "name": "updateApprovedLitActionsManager",
        "inputs": [
          {
            "name": "newManager",
            "type": "address",
            "internalType": "address"
          }
        ],
        "outputs": [],
        "stateMutability": "nonpayable"
      }
    },
    "events": [
      {
        "type": "event",
        "name": "ApprovedLitActionsManagerUpdated",
        "inputs": [
          {
            "name": "previousManager",
            "type": "address",
            "indexed": true,
            "internalType": "address"
          },
          {
            "name": "newManager",
            "type": "address",
            "indexed": true,
            "internalType": "address"
          }
        ],
        "anonymous": false
      },
      {
        "type": "event",
        "name": "LitActionApprovalRemoved",
        "inputs": [
          {
            "name": "litActionIpfsCidHash",
            "type": "bytes32",
            "indexed": true,
            "internalType": "bytes32"
          }
        ],
        "anonymous": false
      },
      {
        "type": "event",
        "name": "LitActionApproved",
        "inputs": [
          {
            "name": "litActionIpfsCidHash",
            "type": "bytes32",
            "indexed": true,
            "internalType": "bytes32"
          }
        ],
        "anonymous": false
      },
      {
        "type": "event",
        "name": "NewLitActionRegistered",
        "inputs": [
          {
            "name": "litActionIpfsCidHash",
            "type": "bytes32",
            "indexed": true,
            "internalType": "bytes32"
          }
        ],
        "anonymous": false
      }
    ],
    "errors": [
      {
        "type": "error",
        "name": "EmptyLitActionIpfsCid",
        "inputs": []
      },
      {
        "type": "error",
        "name": "EmptyLitActionIpfsCidsArray",
        "inputs": []
      },
      {
        "type": "error",
        "name": "InvalidApprovedLitActionsManager",
        "inputs": [
          {
            "name": "manager",
            "type": "address",
            "internalType": "address"
          }
        ]
      },
      {
        "type": "error",
        "name": "LitActionAlreadyApproved",
        "inputs": [
          {
            "name": "litActionIpfsCidHash",
            "type": "bytes32",
            "internalType": "bytes32"
          }
        ]
      },
      {
        "type": "error",
        "name": "LitActionAlreadyRegistered",
        "inputs": [
          {
            "name": "litActionIpfsCidHash",
            "type": "bytes32",
            "internalType": "bytes32"
          }
        ]
      },
      {
        "type": "error",
        "name": "LitActionNotApproved",
        "inputs": [
          {
            "name": "litActionIpfsCidHash",
            "type": "bytes32",
            "internalType": "bytes32"
          }
        ]
      },
      {
        "type": "error",
        "name": "LitActionNotRegistered",
        "inputs": [
          {
            "name": "litActionIpfsCidHash",
            "type": "bytes32",
            "internalType": "bytes32"
          }
        ]
      },
      {
        "type": "error",
        "name": "NotApprovedLitActionsManager",
        "inputs": [
          {
            "name": "caller",
            "type": "address",
            "internalType": "address"
          }
        ]
      }
    ]
  },
  "VincentAppViewFacet": {
    "address": "0x72984b6f4d5d4e737f96782d6602ff5a2a037f91",
    "methods": {
      "getAppByDelegatee": {
        "type": "function",
        "name": "getAppByDelegatee",
        "inputs": [
          {
            "name": "delegatee",
            "type": "address",
            "internalType": "address"
          }
        ],
        "outputs": [
          {
            "name": "app",
            "type": "tuple",
            "internalType": "struct VincentAppViewFacet.App",
            "components": [
              {
                "name": "id",
                "type": "uint256",
                "internalType": "uint256"
              },
              {
                "name": "name",
                "type": "string",
                "internalType": "string"
              },
              {
                "name": "description",
                "type": "string",
                "internalType": "string"
              },
              {
                "name": "manager",
                "type": "address",
                "internalType": "address"
              },
              {
                "name": "latestVersion",
                "type": "uint256",
                "internalType": "uint256"
              },
              {
                "name": "delegatees",
                "type": "address[]",
                "internalType": "address[]"
              },
              {
                "name": "authorizedRedirectUris",
                "type": "string[]",
                "internalType": "string[]"
              }
            ]
          }
        ],
        "stateMutability": "view"
      },
      "getAppById": {
        "type": "function",
        "name": "getAppById",
        "inputs": [
          {
            "name": "appId",
            "type": "uint256",
            "internalType": "uint256"
          }
        ],
        "outputs": [
          {
            "name": "app",
            "type": "tuple",
            "internalType": "struct VincentAppViewFacet.App",
            "components": [
              {
                "name": "id",
                "type": "uint256",
                "internalType": "uint256"
              },
              {
                "name": "name",
                "type": "string",
                "internalType": "string"
              },
              {
                "name": "description",
                "type": "string",
                "internalType": "string"
              },
              {
                "name": "manager",
                "type": "address",
                "internalType": "address"
              },
              {
                "name": "latestVersion",
                "type": "uint256",
                "internalType": "uint256"
              },
              {
                "name": "delegatees",
                "type": "address[]",
                "internalType": "address[]"
              },
              {
                "name": "authorizedRedirectUris",
                "type": "string[]",
                "internalType": "string[]"
              }
            ]
          }
        ],
        "stateMutability": "view"
      },
      "getAppVersion": {
        "type": "function",
        "name": "getAppVersion",
        "inputs": [
          {
            "name": "appId",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "version",
            "type": "uint256",
            "internalType": "uint256"
          }
        ],
        "outputs": [
          {
            "name": "app",
            "type": "tuple",
            "internalType": "struct VincentAppViewFacet.App",
            "components": [
              {
                "name": "id",
                "type": "uint256",
                "internalType": "uint256"
              },
              {
                "name": "name",
                "type": "string",
                "internalType": "string"
              },
              {
                "name": "description",
                "type": "string",
                "internalType": "string"
              },
              {
                "name": "manager",
                "type": "address",
                "internalType": "address"
              },
              {
                "name": "latestVersion",
                "type": "uint256",
                "internalType": "uint256"
              },
              {
                "name": "delegatees",
                "type": "address[]",
                "internalType": "address[]"
              },
              {
                "name": "authorizedRedirectUris",
                "type": "string[]",
                "internalType": "string[]"
              }
            ]
          },
          {
            "name": "appVersion",
            "type": "tuple",
            "internalType": "struct VincentAppViewFacet.AppVersion",
            "components": [
              {
                "name": "version",
                "type": "uint256",
                "internalType": "uint256"
              },
              {
                "name": "enabled",
                "type": "bool",
                "internalType": "bool"
              },
              {
                "name": "delegatedAgentPkpTokenIds",
                "type": "uint256[]",
                "internalType": "uint256[]"
              },
              {
                "name": "tools",
                "type": "tuple[]",
                "internalType": "struct VincentAppViewFacet.Tool[]",
                "components": [
                  {
                    "name": "toolIpfsCid",
                    "type": "string",
                    "internalType": "string"
                  },
                  {
                    "name": "policies",
                    "type": "tuple[]",
                    "internalType": "struct VincentAppViewFacet.Policy[]",
                    "components": [
                      {
                        "name": "policyIpfsCid",
                        "type": "string",
                        "internalType": "string"
                      },
                      {
                        "name": "parameterNames",
                        "type": "string[]",
                        "internalType": "string[]"
                      },
                      {
                        "name": "parameterTypes",
                        "type": "uint8[]",
                        "internalType": "enum VincentAppStorage.ParameterType[]"
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ],
        "stateMutability": "view"
      },
      "getAppsByManager": {
        "type": "function",
        "name": "getAppsByManager",
        "inputs": [
          {
            "name": "manager",
            "type": "address",
            "internalType": "address"
          }
        ],
        "outputs": [
          {
            "name": "appsWithVersions",
            "type": "tuple[]",
            "internalType": "struct VincentAppViewFacet.AppWithVersions[]",
            "components": [
              {
                "name": "app",
                "type": "tuple",
                "internalType": "struct VincentAppViewFacet.App",
                "components": [
                  {
                    "name": "id",
                    "type": "uint256",
                    "internalType": "uint256"
                  },
                  {
                    "name": "name",
                    "type": "string",
                    "internalType": "string"
                  },
                  {
                    "name": "description",
                    "type": "string",
                    "internalType": "string"
                  },
                  {
                    "name": "manager",
                    "type": "address",
                    "internalType": "address"
                  },
                  {
                    "name": "latestVersion",
                    "type": "uint256",
                    "internalType": "uint256"
                  },
                  {
                    "name": "delegatees",
                    "type": "address[]",
                    "internalType": "address[]"
                  },
                  {
                    "name": "authorizedRedirectUris",
                    "type": "string[]",
                    "internalType": "string[]"
                  }
                ]
              },
              {
                "name": "versions",
                "type": "tuple[]",
                "internalType": "struct VincentAppViewFacet.AppVersion[]",
                "components": [
                  {
                    "name": "version",
                    "type": "uint256",
                    "internalType": "uint256"
                  },
                  {
                    "name": "enabled",
                    "type": "bool",
                    "internalType": "bool"
                  },
                  {
                    "name": "delegatedAgentPkpTokenIds",
                    "type": "uint256[]",
                    "internalType": "uint256[]"
                  },
                  {
                    "name": "tools",
                    "type": "tuple[]",
                    "internalType": "struct VincentAppViewFacet.Tool[]",
                    "components": [
                      {
                        "name": "toolIpfsCid",
                        "type": "string",
                        "internalType": "string"
                      },
                      {
                        "name": "policies",
                        "type": "tuple[]",
                        "internalType": "struct VincentAppViewFacet.Policy[]",
                        "components": [
                          {
                            "name": "policyIpfsCid",
                            "type": "string",
                            "internalType": "string"
                          },
                          {
                            "name": "parameterNames",
                            "type": "string[]",
                            "internalType": "string[]"
                          },
                          {
                            "name": "parameterTypes",
                            "type": "uint8[]",
                            "internalType": "enum VincentAppStorage.ParameterType[]"
                          }
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ],
        "stateMutability": "view"
      },
      "getAuthorizedRedirectUriByHash": {
        "type": "function",
        "name": "getAuthorizedRedirectUriByHash",
        "inputs": [
          {
            "name": "redirectUriHash",
            "type": "bytes32",
            "internalType": "bytes32"
          }
        ],
        "outputs": [
          {
            "name": "redirectUri",
            "type": "string",
            "internalType": "string"
          }
        ],
        "stateMutability": "view"
      },
      "getAuthorizedRedirectUrisByAppId": {
        "type": "function",
        "name": "getAuthorizedRedirectUrisByAppId",
        "inputs": [
          {
            "name": "appId",
            "type": "uint256",
            "internalType": "uint256"
          }
        ],
        "outputs": [
          {
            "name": "redirectUris",
            "type": "string[]",
            "internalType": "string[]"
          }
        ],
        "stateMutability": "view"
      },
      "getTotalAppCount": {
        "type": "function",
        "name": "getTotalAppCount",
        "inputs": [],
        "outputs": [
          {
            "name": "",
            "type": "uint256",
            "internalType": "uint256"
          }
        ],
        "stateMutability": "view"
      }
    },
    "events": [],
    "errors": [
      {
        "type": "error",
        "name": "AppNotRegistered",
        "inputs": [
          {
            "name": "appId",
            "type": "uint256",
            "internalType": "uint256"
          }
        ]
      },
      {
        "type": "error",
        "name": "AppVersionNotRegistered",
        "inputs": [
          {
            "name": "appId",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "appVersion",
            "type": "uint256",
            "internalType": "uint256"
          }
        ]
      },
      {
        "type": "error",
        "name": "DelegateeNotRegistered",
        "inputs": [
          {
            "name": "delegatee",
            "type": "address",
            "internalType": "address"
          }
        ]
      },
      {
        "type": "error",
        "name": "NoAppsFoundForManager",
        "inputs": [
          {
            "name": "manager",
            "type": "address",
            "internalType": "address"
          }
        ]
      },
      {
        "type": "error",
        "name": "NoAuthorizedRedirectUrisFoundForApp",
        "inputs": [
          {
            "name": "appId",
            "type": "uint256",
            "internalType": "uint256"
          }
        ]
      },
      {
        "type": "error",
        "name": "RedirectUriNotFound",
        "inputs": [
          {
            "name": "redirectUriHash",
            "type": "bytes32",
            "internalType": "bytes32"
          }
        ]
      },
      {
        "type": "error",
        "name": "ZeroAddressNotAllowed",
        "inputs": []
      }
    ]
  },
  "VincentUserViewFacet": {
    "address": "0x9fee9f5db65e3296401094e8144eaed07b52ec3c",
    "methods": {
      "getAllPermittedAppIdsForPkp": {
        "type": "function",
        "name": "getAllPermittedAppIdsForPkp",
        "inputs": [
          {
            "name": "pkpTokenId",
            "type": "uint256",
            "internalType": "uint256"
          }
        ],
        "outputs": [
          {
            "name": "",
            "type": "uint256[]",
            "internalType": "uint256[]"
          }
        ],
        "stateMutability": "view"
      },
      "getAllRegisteredAgentPkps": {
        "type": "function",
        "name": "getAllRegisteredAgentPkps",
        "inputs": [
          {
            "name": "userAddress",
            "type": "address",
            "internalType": "address"
          }
        ],
        "outputs": [
          {
            "name": "",
            "type": "uint256[]",
            "internalType": "uint256[]"
          }
        ],
        "stateMutability": "view"
      },
      "getAllToolsAndPoliciesForApp": {
        "type": "function",
        "name": "getAllToolsAndPoliciesForApp",
        "inputs": [
          {
            "name": "pkpTokenId",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "appId",
            "type": "uint256",
            "internalType": "uint256"
          }
        ],
        "outputs": [
          {
            "name": "tools",
            "type": "tuple[]",
            "internalType": "struct VincentUserViewFacet.ToolWithPolicies[]",
            "components": [
              {
                "name": "toolIpfsCid",
                "type": "string",
                "internalType": "string"
              },
              {
                "name": "policies",
                "type": "tuple[]",
                "internalType": "struct VincentUserViewFacet.PolicyWithParameters[]",
                "components": [
                  {
                    "name": "policyIpfsCid",
                    "type": "string",
                    "internalType": "string"
                  },
                  {
                    "name": "parameters",
                    "type": "tuple[]",
                    "internalType": "struct VincentUserViewFacet.PolicyParameter[]",
                    "components": [
                      {
                        "name": "name",
                        "type": "string",
                        "internalType": "string"
                      },
                      {
                        "name": "paramType",
                        "type": "uint8",
                        "internalType": "enum VincentAppStorage.ParameterType"
                      },
                      {
                        "name": "value",
                        "type": "bytes",
                        "internalType": "bytes"
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ],
        "stateMutability": "view"
      },
      "getPermittedAppVersionForPkp": {
        "type": "function",
        "name": "getPermittedAppVersionForPkp",
        "inputs": [
          {
            "name": "pkpTokenId",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "appId",
            "type": "uint256",
            "internalType": "uint256"
          }
        ],
        "outputs": [
          {
            "name": "",
            "type": "uint256",
            "internalType": "uint256"
          }
        ],
        "stateMutability": "view"
      },
      "validateToolExecutionAndGetPolicies": {
        "type": "function",
        "name": "validateToolExecutionAndGetPolicies",
        "inputs": [
          {
            "name": "delegatee",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "pkpTokenId",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "toolIpfsCid",
            "type": "string",
            "internalType": "string"
          }
        ],
        "outputs": [
          {
            "name": "validation",
            "type": "tuple",
            "internalType": "struct VincentUserViewFacet.ToolExecutionValidation",
            "components": [
              {
                "name": "isPermitted",
                "type": "bool",
                "internalType": "bool"
              },
              {
                "name": "appId",
                "type": "uint256",
                "internalType": "uint256"
              },
              {
                "name": "appVersion",
                "type": "uint256",
                "internalType": "uint256"
              },
              {
                "name": "policies",
                "type": "tuple[]",
                "internalType": "struct VincentUserViewFacet.PolicyWithParameters[]",
                "components": [
                  {
                    "name": "policyIpfsCid",
                    "type": "string",
                    "internalType": "string"
                  },
                  {
                    "name": "parameters",
                    "type": "tuple[]",
                    "internalType": "struct VincentUserViewFacet.PolicyParameter[]",
                    "components": [
                      {
                        "name": "name",
                        "type": "string",
                        "internalType": "string"
                      },
                      {
                        "name": "paramType",
                        "type": "uint8",
                        "internalType": "enum VincentAppStorage.ParameterType"
                      },
                      {
                        "name": "value",
                        "type": "bytes",
                        "internalType": "bytes"
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ],
        "stateMutability": "view"
      }
    },
    "events": [],
    "errors": [
      {
        "type": "error",
        "name": "AppNotRegistered",
        "inputs": [
          {
            "name": "appId",
            "type": "uint256",
            "internalType": "uint256"
          }
        ]
      },
      {
        "type": "error",
        "name": "AppVersionNotRegistered",
        "inputs": [
          {
            "name": "appId",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "appVersion",
            "type": "uint256",
            "internalType": "uint256"
          }
        ]
      },
      {
        "type": "error",
        "name": "DelegateeNotAssociatedWithApp",
        "inputs": [
          {
            "name": "delegatee",
            "type": "address",
            "internalType": "address"
          }
        ]
      },
      {
        "type": "error",
        "name": "EmptyToolIpfsCid",
        "inputs": []
      },
      {
        "type": "error",
        "name": "InvalidAppId",
        "inputs": []
      },
      {
        "type": "error",
        "name": "InvalidPkpTokenId",
        "inputs": []
      },
      {
        "type": "error",
        "name": "NoRegisteredPkpsFound",
        "inputs": [
          {
            "name": "userAddress",
            "type": "address",
            "internalType": "address"
          }
        ]
      },
      {
        "type": "error",
        "name": "PkpNotPermittedForAppVersion",
        "inputs": [
          {
            "name": "pkpTokenId",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "appId",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "appVersion",
            "type": "uint256",
            "internalType": "uint256"
          }
        ]
      },
      {
        "type": "error",
        "name": "PolicyParameterNotSetForPkp",
        "inputs": [
          {
            "name": "pkpTokenId",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "appId",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "appVersion",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "policyIpfsCid",
            "type": "string",
            "internalType": "string"
          },
          {
            "name": "parameterName",
            "type": "string",
            "internalType": "string"
          }
        ]
      },
      {
        "type": "error",
        "name": "ZeroAddressNotAllowed",
        "inputs": []
      }
    ]
  },
  "VincentLitActionViewFacet": {
    "address": "0x9ebcc840ecc6cde51562e81d5b4931583d0c99f6",
    "methods": {
      "getAllApprovedLitActions": {
        "type": "function",
        "name": "getAllApprovedLitActions",
        "inputs": [],
        "outputs": [
          {
            "name": "litActionIpfsCids",
            "type": "string[]",
            "internalType": "string[]"
          }
        ],
        "stateMutability": "view"
      },
      "getApprovedLitActionsManager": {
        "type": "function",
        "name": "getApprovedLitActionsManager",
        "inputs": [],
        "outputs": [
          {
            "name": "manager",
            "type": "address",
            "internalType": "address"
          }
        ],
        "stateMutability": "view"
      },
      "getLitActionIpfsCidByHash": {
        "type": "function",
        "name": "getLitActionIpfsCidByHash",
        "inputs": [
          {
            "name": "litActionIpfsCidHash",
            "type": "bytes32",
            "internalType": "bytes32"
          }
        ],
        "outputs": [
          {
            "name": "",
            "type": "string",
            "internalType": "string"
          }
        ],
        "stateMutability": "view"
      },
      "isLitActionApproved": {
        "type": "function",
        "name": "isLitActionApproved",
        "inputs": [
          {
            "name": "litActionIpfsCid",
            "type": "string",
            "internalType": "string"
          }
        ],
        "outputs": [
          {
            "name": "isApproved",
            "type": "bool",
            "internalType": "bool"
          }
        ],
        "stateMutability": "view"
      }
    },
    "events": [],
    "errors": [
      {
        "type": "error",
        "name": "EmptyLitActionIpfsCid",
        "inputs": []
      },
      {
        "type": "error",
        "name": "LitActionHashNotFound",
        "inputs": [
          {
            "name": "litActionIpfsCidHash",
            "type": "bytes32",
            "internalType": "bytes32"
          }
        ]
      },
      {
        "type": "error",
        "name": "NoLitActionsApproved",
        "inputs": []
      },
      {
        "type": "error",
        "name": "NoLitActionsRegistered",
        "inputs": []
      }
    ]
  },
  "VincentAppFacet": {
    "address": "0x1d5f6ecabc2da760ca7e8554c222b8bc35b36701",
    "methods": {
      "addAuthorizedRedirectUri": {
        "type": "function",
        "name": "addAuthorizedRedirectUri",
        "inputs": [
          {
            "name": "appId",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "redirectUri",
            "type": "string",
            "internalType": "string"
          }
        ],
        "outputs": [],
        "stateMutability": "nonpayable"
      },
      "addDelegatee": {
        "type": "function",
        "name": "addDelegatee",
        "inputs": [
          {
            "name": "appId",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "delegatee",
            "type": "address",
            "internalType": "address"
          }
        ],
        "outputs": [],
        "stateMutability": "nonpayable"
      },
      "enableAppVersion": {
        "type": "function",
        "name": "enableAppVersion",
        "inputs": [
          {
            "name": "appId",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "appVersion",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "enabled",
            "type": "bool",
            "internalType": "bool"
          }
        ],
        "outputs": [],
        "stateMutability": "nonpayable"
      },
      "registerApp": {
        "type": "function",
        "name": "registerApp",
        "inputs": [
          {
            "name": "name",
            "type": "string",
            "internalType": "string"
          },
          {
            "name": "description",
            "type": "string",
            "internalType": "string"
          },
          {
            "name": "authorizedRedirectUris",
            "type": "string[]",
            "internalType": "string[]"
          },
          {
            "name": "delegatees",
            "type": "address[]",
            "internalType": "address[]"
          },
          {
            "name": "toolIpfsCids",
            "type": "string[]",
            "internalType": "string[]"
          },
          {
            "name": "toolPolicies",
            "type": "string[][]",
            "internalType": "string[][]"
          },
          {
            "name": "toolPolicyParameterNames",
            "type": "string[][][]",
            "internalType": "string[][][]"
          },
          {
            "name": "toolPolicyParameterTypes",
            "type": "uint8[][][]",
            "internalType": "enum VincentAppStorage.ParameterType[][][]"
          }
        ],
        "outputs": [
          {
            "name": "newAppId",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "newAppVersion",
            "type": "uint256",
            "internalType": "uint256"
          }
        ],
        "stateMutability": "nonpayable"
      },
      "registerNextAppVersion": {
        "type": "function",
        "name": "registerNextAppVersion",
        "inputs": [
          {
            "name": "appId",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "toolIpfsCids",
            "type": "string[]",
            "internalType": "string[]"
          },
          {
            "name": "toolPolicies",
            "type": "string[][]",
            "internalType": "string[][]"
          },
          {
            "name": "toolPolicyParameterNames",
            "type": "string[][][]",
            "internalType": "string[][][]"
          },
          {
            "name": "toolPolicyParameterTypes",
            "type": "uint8[][][]",
            "internalType": "enum VincentAppStorage.ParameterType[][][]"
          }
        ],
        "outputs": [
          {
            "name": "newAppVersion",
            "type": "uint256",
            "internalType": "uint256"
          }
        ],
        "stateMutability": "nonpayable"
      },
      "removeAuthorizedRedirectUri": {
        "type": "function",
        "name": "removeAuthorizedRedirectUri",
        "inputs": [
          {
            "name": "appId",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "redirectUri",
            "type": "string",
            "internalType": "string"
          }
        ],
        "outputs": [],
        "stateMutability": "nonpayable"
      },
      "removeDelegatee": {
        "type": "function",
        "name": "removeDelegatee",
        "inputs": [
          {
            "name": "appId",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "delegatee",
            "type": "address",
            "internalType": "address"
          }
        ],
        "outputs": [],
        "stateMutability": "nonpayable"
      }
    },
    "events": [
      {
        "type": "event",
        "name": "AppEnabled",
        "inputs": [
          {
            "name": "appId",
            "type": "uint256",
            "indexed": true,
            "internalType": "uint256"
          },
          {
            "name": "appVersion",
            "type": "uint256",
            "indexed": true,
            "internalType": "uint256"
          },
          {
            "name": "enabled",
            "type": "bool",
            "indexed": true,
            "internalType": "bool"
          }
        ],
        "anonymous": false
      },
      {
        "type": "event",
        "name": "AuthorizedRedirectUriAdded",
        "inputs": [
          {
            "name": "appId",
            "type": "uint256",
            "indexed": true,
            "internalType": "uint256"
          },
          {
            "name": "hashedRedirectUri",
            "type": "bytes32",
            "indexed": true,
            "internalType": "bytes32"
          }
        ],
        "anonymous": false
      },
      {
        "type": "event",
        "name": "AuthorizedRedirectUriRemoved",
        "inputs": [
          {
            "name": "appId",
            "type": "uint256",
            "indexed": true,
            "internalType": "uint256"
          },
          {
            "name": "hashedRedirectUri",
            "type": "bytes32",
            "indexed": true,
            "internalType": "bytes32"
          }
        ],
        "anonymous": false
      },
      {
        "type": "event",
        "name": "DelegateeAdded",
        "inputs": [
          {
            "name": "appId",
            "type": "uint256",
            "indexed": true,
            "internalType": "uint256"
          },
          {
            "name": "delegatee",
            "type": "address",
            "indexed": true,
            "internalType": "address"
          }
        ],
        "anonymous": false
      },
      {
        "type": "event",
        "name": "DelegateeRemoved",
        "inputs": [
          {
            "name": "appId",
            "type": "uint256",
            "indexed": true,
            "internalType": "uint256"
          },
          {
            "name": "delegatee",
            "type": "address",
            "indexed": true,
            "internalType": "address"
          }
        ],
        "anonymous": false
      },
      {
        "type": "event",
        "name": "NewAppRegistered",
        "inputs": [
          {
            "name": "appId",
            "type": "uint256",
            "indexed": true,
            "internalType": "uint256"
          },
          {
            "name": "manager",
            "type": "address",
            "indexed": true,
            "internalType": "address"
          }
        ],
        "anonymous": false
      },
      {
        "type": "event",
        "name": "NewAppVersionRegistered",
        "inputs": [
          {
            "name": "appId",
            "type": "uint256",
            "indexed": true,
            "internalType": "uint256"
          },
          {
            "name": "appVersion",
            "type": "uint256",
            "indexed": true,
            "internalType": "uint256"
          },
          {
            "name": "manager",
            "type": "address",
            "indexed": true,
            "internalType": "address"
          }
        ],
        "anonymous": false
      },
      {
        "type": "event",
        "name": "NewLitActionRegistered",
        "inputs": [
          {
            "name": "litActionIpfsCidHash",
            "type": "bytes32",
            "indexed": true,
            "internalType": "bytes32"
          }
        ],
        "anonymous": false
      }
    ],
    "errors": [
      {
        "type": "error",
        "name": "AppNotRegistered",
        "inputs": [
          {
            "name": "appId",
            "type": "uint256",
            "internalType": "uint256"
          }
        ]
      },
      {
        "type": "error",
        "name": "AppVersionAlreadyInRequestedState",
        "inputs": [
          {
            "name": "appId",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "appVersion",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "enabled",
            "type": "bool",
            "internalType": "bool"
          }
        ]
      },
      {
        "type": "error",
        "name": "AppVersionNotRegistered",
        "inputs": [
          {
            "name": "appId",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "appVersion",
            "type": "uint256",
            "internalType": "uint256"
          }
        ]
      },
      {
        "type": "error",
        "name": "CannotRemoveLastRedirectUri",
        "inputs": [
          {
            "name": "appId",
            "type": "uint256",
            "internalType": "uint256"
          }
        ]
      },
      {
        "type": "error",
        "name": "DelegateeAlreadyRegisteredToApp",
        "inputs": [
          {
            "name": "appId",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "delegatee",
            "type": "address",
            "internalType": "address"
          }
        ]
      },
      {
        "type": "error",
        "name": "DelegateeNotRegisteredToApp",
        "inputs": [
          {
            "name": "appId",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "delegatee",
            "type": "address",
            "internalType": "address"
          }
        ]
      },
      {
        "type": "error",
        "name": "DuplicateParameterNameNotAllowed",
        "inputs": [
          {
            "name": "appId",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "toolIndex",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "policyIndex",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "paramName",
            "type": "string",
            "internalType": "string"
          },
          {
            "name": "firstIndex",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "duplicateIndex",
            "type": "uint256",
            "internalType": "uint256"
          }
        ]
      },
      {
        "type": "error",
        "name": "DuplicatePolicyIpfsCidNotAllowed",
        "inputs": [
          {
            "name": "appId",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "toolIndex",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "policyIpfsCid",
            "type": "string",
            "internalType": "string"
          },
          {
            "name": "firstIndex",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "duplicateIndex",
            "type": "uint256",
            "internalType": "uint256"
          }
        ]
      },
      {
        "type": "error",
        "name": "DuplicateToolIpfsCidNotAllowed",
        "inputs": [
          {
            "name": "appId",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "toolIpfsCid",
            "type": "string",
            "internalType": "string"
          },
          {
            "name": "firstIndex",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "duplicateIndex",
            "type": "uint256",
            "internalType": "uint256"
          }
        ]
      },
      {
        "type": "error",
        "name": "EmptyAppDescriptionNotAllowed",
        "inputs": []
      },
      {
        "type": "error",
        "name": "EmptyAppNameNotAllowed",
        "inputs": []
      },
      {
        "type": "error",
        "name": "EmptyParameterNameNotAllowed",
        "inputs": [
          {
            "name": "appId",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "toolIndex",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "policyIndex",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "paramIndex",
            "type": "uint256",
            "internalType": "uint256"
          }
        ]
      },
      {
        "type": "error",
        "name": "EmptyPolicyIpfsCidNotAllowed",
        "inputs": [
          {
            "name": "appId",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "toolIndex",
            "type": "uint256",
            "internalType": "uint256"
          }
        ]
      },
      {
        "type": "error",
        "name": "EmptyRedirectUriNotAllowed",
        "inputs": []
      },
      {
        "type": "error",
        "name": "EmptyToolIpfsCidNotAllowed",
        "inputs": [
          {
            "name": "appId",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "toolIndex",
            "type": "uint256",
            "internalType": "uint256"
          }
        ]
      },
      {
        "type": "error",
        "name": "NoPoliciesProvidedForTool",
        "inputs": [
          {
            "name": "appId",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "toolIndex",
            "type": "uint256",
            "internalType": "uint256"
          }
        ]
      },
      {
        "type": "error",
        "name": "NoRedirectUrisProvided",
        "inputs": []
      },
      {
        "type": "error",
        "name": "NoToolsProvided",
        "inputs": [
          {
            "name": "appId",
            "type": "uint256",
            "internalType": "uint256"
          }
        ]
      },
      {
        "type": "error",
        "name": "NotAppManager",
        "inputs": [
          {
            "name": "appId",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "msgSender",
            "type": "address",
            "internalType": "address"
          }
        ]
      },
      {
        "type": "error",
        "name": "ParameterArrayLengthMismatch",
        "inputs": [
          {
            "name": "toolIndex",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "policyIndex",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "paramNamesLength",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "paramTypesLength",
            "type": "uint256",
            "internalType": "uint256"
          }
        ]
      },
      {
        "type": "error",
        "name": "PolicyArrayLengthMismatch",
        "inputs": [
          {
            "name": "toolIndex",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "policiesLength",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "paramNamesLength",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "paramTypesLength",
            "type": "uint256",
            "internalType": "uint256"
          }
        ]
      },
      {
        "type": "error",
        "name": "RedirectUriAlreadyAuthorizedForApp",
        "inputs": [
          {
            "name": "appId",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "redirectUri",
            "type": "string",
            "internalType": "string"
          }
        ]
      },
      {
        "type": "error",
        "name": "RedirectUriNotRegisteredToApp",
        "inputs": [
          {
            "name": "appId",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "redirectUri",
            "type": "string",
            "internalType": "string"
          }
        ]
      },
      {
        "type": "error",
        "name": "ToolArrayDimensionMismatch",
        "inputs": [
          {
            "name": "toolsLength",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "policiesLength",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "paramNamesLength",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "paramTypesLength",
            "type": "uint256",
            "internalType": "uint256"
          }
        ]
      },
      {
        "type": "error",
        "name": "ToolsAndPoliciesLengthMismatch",
        "inputs": []
      },
      {
        "type": "error",
        "name": "ZeroAddressDelegateeNotAllowed",
        "inputs": []
      }
    ]
  },
  "VincentUserFacet": {
    "address": "0x5b0d51ef015b2b90166149fd13329ecac8e96b0c",
    "methods": {
      "permitAppVersion": {
        "type": "function",
        "name": "permitAppVersion",
        "inputs": [
          {
            "name": "pkpTokenId",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "appId",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "appVersion",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "toolIpfsCids",
            "type": "string[]",
            "internalType": "string[]"
          },
          {
            "name": "policyIpfsCids",
            "type": "string[][]",
            "internalType": "string[][]"
          },
          {
            "name": "policyParameterNames",
            "type": "string[][][]",
            "internalType": "string[][][]"
          },
          {
            "name": "policyParameterValues",
            "type": "bytes[][][]",
            "internalType": "bytes[][][]"
          }
        ],
        "outputs": [],
        "stateMutability": "nonpayable"
      },
      "removeToolPolicyParameters": {
        "type": "function",
        "name": "removeToolPolicyParameters",
        "inputs": [
          {
            "name": "appId",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "pkpTokenId",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "appVersion",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "toolIpfsCids",
            "type": "string[]",
            "internalType": "string[]"
          },
          {
            "name": "policyIpfsCids",
            "type": "string[][]",
            "internalType": "string[][]"
          },
          {
            "name": "policyParameterNames",
            "type": "string[][][]",
            "internalType": "string[][][]"
          }
        ],
        "outputs": [],
        "stateMutability": "nonpayable"
      },
      "setToolPolicyParameters": {
        "type": "function",
        "name": "setToolPolicyParameters",
        "inputs": [
          {
            "name": "pkpTokenId",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "appId",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "appVersion",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "toolIpfsCids",
            "type": "string[]",
            "internalType": "string[]"
          },
          {
            "name": "policyIpfsCids",
            "type": "string[][]",
            "internalType": "string[][]"
          },
          {
            "name": "policyParameterNames",
            "type": "string[][][]",
            "internalType": "string[][][]"
          },
          {
            "name": "policyParameterValues",
            "type": "bytes[][][]",
            "internalType": "bytes[][][]"
          }
        ],
        "outputs": [],
        "stateMutability": "nonpayable"
      },
      "unPermitAppVersion": {
        "type": "function",
        "name": "unPermitAppVersion",
        "inputs": [
          {
            "name": "pkpTokenId",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "appId",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "appVersion",
            "type": "uint256",
            "internalType": "uint256"
          }
        ],
        "outputs": [],
        "stateMutability": "nonpayable"
      }
    },
    "events": [
      {
        "type": "event",
        "name": "AppVersionPermitted",
        "inputs": [
          {
            "name": "pkpTokenId",
            "type": "uint256",
            "indexed": true,
            "internalType": "uint256"
          },
          {
            "name": "appId",
            "type": "uint256",
            "indexed": true,
            "internalType": "uint256"
          },
          {
            "name": "appVersion",
            "type": "uint256",
            "indexed": true,
            "internalType": "uint256"
          }
        ],
        "anonymous": false
      },
      {
        "type": "event",
        "name": "AppVersionUnPermitted",
        "inputs": [
          {
            "name": "pkpTokenId",
            "type": "uint256",
            "indexed": true,
            "internalType": "uint256"
          },
          {
            "name": "appId",
            "type": "uint256",
            "indexed": true,
            "internalType": "uint256"
          },
          {
            "name": "appVersion",
            "type": "uint256",
            "indexed": true,
            "internalType": "uint256"
          }
        ],
        "anonymous": false
      },
      {
        "type": "event",
        "name": "NewUserAgentPkpRegistered",
        "inputs": [
          {
            "name": "userAddress",
            "type": "address",
            "indexed": true,
            "internalType": "address"
          },
          {
            "name": "pkpTokenId",
            "type": "uint256",
            "indexed": true,
            "internalType": "uint256"
          }
        ],
        "anonymous": false
      },
      {
        "type": "event",
        "name": "ToolPolicyParameterRemoved",
        "inputs": [
          {
            "name": "pkpTokenId",
            "type": "uint256",
            "indexed": true,
            "internalType": "uint256"
          },
          {
            "name": "appId",
            "type": "uint256",
            "indexed": true,
            "internalType": "uint256"
          },
          {
            "name": "appVersion",
            "type": "uint256",
            "indexed": true,
            "internalType": "uint256"
          },
          {
            "name": "hashedToolIpfsCid",
            "type": "bytes32",
            "indexed": false,
            "internalType": "bytes32"
          },
          {
            "name": "hashedPolicyParameterName",
            "type": "bytes32",
            "indexed": false,
            "internalType": "bytes32"
          }
        ],
        "anonymous": false
      },
      {
        "type": "event",
        "name": "ToolPolicyParameterSet",
        "inputs": [
          {
            "name": "pkpTokenId",
            "type": "uint256",
            "indexed": true,
            "internalType": "uint256"
          },
          {
            "name": "appId",
            "type": "uint256",
            "indexed": true,
            "internalType": "uint256"
          },
          {
            "name": "appVersion",
            "type": "uint256",
            "indexed": true,
            "internalType": "uint256"
          },
          {
            "name": "hashedToolIpfsCid",
            "type": "bytes32",
            "indexed": false,
            "internalType": "bytes32"
          },
          {
            "name": "hashedPolicyParameterName",
            "type": "bytes32",
            "indexed": false,
            "internalType": "bytes32"
          }
        ],
        "anonymous": false
      }
    ],
    "errors": [
      {
        "type": "error",
        "name": "AppNotRegistered",
        "inputs": [
          {
            "name": "appId",
            "type": "uint256",
            "internalType": "uint256"
          }
        ]
      },
      {
        "type": "error",
        "name": "AppVersionAlreadyPermitted",
        "inputs": [
          {
            "name": "pkpTokenId",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "appId",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "appVersion",
            "type": "uint256",
            "internalType": "uint256"
          }
        ]
      },
      {
        "type": "error",
        "name": "AppVersionNotEnabled",
        "inputs": [
          {
            "name": "appId",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "appVersion",
            "type": "uint256",
            "internalType": "uint256"
          }
        ]
      },
      {
        "type": "error",
        "name": "AppVersionNotPermitted",
        "inputs": [
          {
            "name": "pkpTokenId",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "appId",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "appVersion",
            "type": "uint256",
            "internalType": "uint256"
          }
        ]
      },
      {
        "type": "error",
        "name": "AppVersionNotRegistered",
        "inputs": [
          {
            "name": "appId",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "appVersion",
            "type": "uint256",
            "internalType": "uint256"
          }
        ]
      },
      {
        "type": "error",
        "name": "DuplicateParameterNameNotAllowed",
        "inputs": [
          {
            "name": "appId",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "toolIndex",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "policyIndex",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "paramName",
            "type": "string",
            "internalType": "string"
          },
          {
            "name": "firstIndex",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "duplicateIndex",
            "type": "uint256",
            "internalType": "uint256"
          }
        ]
      },
      {
        "type": "error",
        "name": "EmptyParameterName",
        "inputs": []
      },
      {
        "type": "error",
        "name": "EmptyParameterValue",
        "inputs": [
          {
            "name": "parameterName",
            "type": "string",
            "internalType": "string"
          }
        ]
      },
      {
        "type": "error",
        "name": "EmptyPolicyIpfsCid",
        "inputs": []
      },
      {
        "type": "error",
        "name": "EmptyToolIpfsCid",
        "inputs": []
      },
      {
        "type": "error",
        "name": "InvalidInput",
        "inputs": []
      },
      {
        "type": "error",
        "name": "NotAllRegisteredToolsProvided",
        "inputs": [
          {
            "name": "appId",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "appVersion",
            "type": "uint256",
            "internalType": "uint256"
          }
        ]
      },
      {
        "type": "error",
        "name": "NotPkpOwner",
        "inputs": [
          {
            "name": "pkpTokenId",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "msgSender",
            "type": "address",
            "internalType": "address"
          }
        ]
      },
      {
        "type": "error",
        "name": "ParameterArrayLengthMismatch",
        "inputs": [
          {
            "name": "toolIndex",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "policyIndex",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "paramNamesLength",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "paramValuesLength",
            "type": "uint256",
            "internalType": "uint256"
          }
        ]
      },
      {
        "type": "error",
        "name": "PkpTokenDoesNotExist",
        "inputs": [
          {
            "name": "pkpTokenId",
            "type": "uint256",
            "internalType": "uint256"
          }
        ]
      },
      {
        "type": "error",
        "name": "PolicyArrayLengthMismatch",
        "inputs": [
          {
            "name": "toolIndex",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "policiesLength",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "paramNamesLength",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "paramValuesLength",
            "type": "uint256",
            "internalType": "uint256"
          }
        ]
      },
      {
        "type": "error",
        "name": "PolicyParameterNameNotRegisteredForAppVersion",
        "inputs": [
          {
            "name": "appId",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "appVersion",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "toolIpfsCid",
            "type": "string",
            "internalType": "string"
          },
          {
            "name": "toolPolicyIpfsCid",
            "type": "string",
            "internalType": "string"
          },
          {
            "name": "policyParameterName",
            "type": "string",
            "internalType": "string"
          }
        ]
      },
      {
        "type": "error",
        "name": "ToolNotRegisteredForAppVersion",
        "inputs": [
          {
            "name": "appId",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "appVersion",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "toolIpfsCid",
            "type": "string",
            "internalType": "string"
          }
        ]
      },
      {
        "type": "error",
        "name": "ToolPolicyNotRegisteredForAppVersion",
        "inputs": [
          {
            "name": "appId",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "appVersion",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "toolIpfsCid",
            "type": "string",
            "internalType": "string"
          },
          {
            "name": "toolPolicyIpfsCid",
            "type": "string",
            "internalType": "string"
          }
        ]
      },
      {
        "type": "error",
        "name": "ToolsAndPoliciesLengthMismatch",
        "inputs": []
      },
      {
        "type": "error",
        "name": "ZeroPkpTokenId",
        "inputs": []
      }
    ]
  }
} as const;
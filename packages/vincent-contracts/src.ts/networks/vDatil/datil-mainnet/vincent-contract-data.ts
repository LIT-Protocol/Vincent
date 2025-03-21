/**
 * Generated Contract Data for Vincent SDK
 * This file is auto-generated. DO NOT EDIT UNLESS YOU KNOW WHAT YOU'RE DOING.
 */

export const vincentDiamondAddress = '0x87cD7840425Fe836ea5fEc2b8Dea40149042AdCe';

export const vincentContractData = [
  {
    "VincentToolFacet": [
      {
        "type": "function",
        "name": "approveTools",
        "inputs": [
          {
            "name": "toolIpfsCids",
            "type": "string[]",
            "internalType": "string[]"
          }
        ],
        "outputs": [],
        "stateMutability": "nonpayable"
      },
      {
        "type": "function",
        "name": "registerTools",
        "inputs": [
          {
            "name": "toolIpfsCids",
            "type": "string[]",
            "internalType": "string[]"
          }
        ],
        "outputs": [],
        "stateMutability": "nonpayable"
      },
      {
        "type": "function",
        "name": "removeToolApprovals",
        "inputs": [
          {
            "name": "toolIpfsCids",
            "type": "string[]",
            "internalType": "string[]"
          }
        ],
        "outputs": [],
        "stateMutability": "nonpayable"
      },
      {
        "type": "function",
        "name": "updateApprovedToolsManager",
        "inputs": [
          {
            "name": "newManager",
            "type": "address",
            "internalType": "address"
          }
        ],
        "outputs": [],
        "stateMutability": "nonpayable"
      },
      {
        "type": "event",
        "name": "ApprovedToolsManagerUpdated",
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
        "name": "NewToolRegistered",
        "inputs": [
          {
            "name": "toolIpfsCidHash",
            "type": "bytes32",
            "indexed": true,
            "internalType": "bytes32"
          }
        ],
        "anonymous": false
      },
      {
        "type": "event",
        "name": "ToolApprovalRemoved",
        "inputs": [
          {
            "name": "toolIpfsCidHash",
            "type": "bytes32",
            "indexed": true,
            "internalType": "bytes32"
          }
        ],
        "anonymous": false
      },
      {
        "type": "event",
        "name": "ToolApproved",
        "inputs": [
          {
            "name": "toolIpfsCidHash",
            "type": "bytes32",
            "indexed": true,
            "internalType": "bytes32"
          }
        ],
        "anonymous": false
      },
      {
        "type": "error",
        "name": "EmptyToolIpfsCid",
        "inputs": []
      },
      {
        "type": "error",
        "name": "EmptyToolIpfsCidsArray",
        "inputs": []
      },
      {
        "type": "error",
        "name": "InvalidApprovedToolsManager",
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
        "name": "NotApprovedToolsManager",
        "inputs": [
          {
            "name": "caller",
            "type": "address",
            "internalType": "address"
          }
        ]
      },
      {
        "type": "error",
        "name": "ToolAlreadyApproved",
        "inputs": [
          {
            "name": "toolIpfsCidHash",
            "type": "bytes32",
            "internalType": "bytes32"
          }
        ]
      },
      {
        "type": "error",
        "name": "ToolAlreadyRegistered",
        "inputs": [
          {
            "name": "toolIpfsCidHash",
            "type": "bytes32",
            "internalType": "bytes32"
          }
        ]
      },
      {
        "type": "error",
        "name": "ToolNotApproved",
        "inputs": [
          {
            "name": "toolIpfsCidHash",
            "type": "bytes32",
            "internalType": "bytes32"
          }
        ]
      },
      {
        "type": "error",
        "name": "ToolNotRegistered",
        "inputs": [
          {
            "name": "toolIpfsCidHash",
            "type": "bytes32",
            "internalType": "bytes32"
          }
        ]
      }
    ]
  },
  {
    "VincentToolViewFacet": [
      {
        "type": "function",
        "name": "getAllApprovedTools",
        "inputs": [],
        "outputs": [
          {
            "name": "toolIpfsCids",
            "type": "string[]",
            "internalType": "string[]"
          }
        ],
        "stateMutability": "view"
      },
      {
        "type": "function",
        "name": "getApprovedToolsManager",
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
      {
        "type": "function",
        "name": "getToolIpfsCidByHash",
        "inputs": [
          {
            "name": "toolIpfsCidHash",
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
      {
        "type": "function",
        "name": "isToolApproved",
        "inputs": [
          {
            "name": "toolIpfsCid",
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
      },
      {
        "type": "error",
        "name": "EmptyToolIpfsCid",
        "inputs": []
      },
      {
        "type": "error",
        "name": "NoToolsApproved",
        "inputs": []
      },
      {
        "type": "error",
        "name": "NoToolsRegistered",
        "inputs": []
      },
      {
        "type": "error",
        "name": "ToolHashNotFound",
        "inputs": [
          {
            "name": "toolIpfsCidHash",
            "type": "bytes32",
            "internalType": "bytes32"
          }
        ]
      }
    ]
  },
  {
    "VincentAppViewFacet": [
      {
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
      {
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
      {
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
      {
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
      {
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
      {
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
      {
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
      },
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
  {
    "VincentUserViewFacet": [
      {
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
      {
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
      {
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
      {
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
      {
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
      },
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
  {
    "VincentAppFacet": [
      {
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
      {
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
      {
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
      {
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
      {
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
      {
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
      {
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
      },
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
        "name": "NewToolRegistered",
        "inputs": [
          {
            "name": "toolIpfsCidHash",
            "type": "bytes32",
            "indexed": true,
            "internalType": "bytes32"
          }
        ],
        "anonymous": false
      },
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
  {
    "VincentUserFacet": [
      {
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
      {
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
      {
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
      {
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
      },
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
      },
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
] as const;
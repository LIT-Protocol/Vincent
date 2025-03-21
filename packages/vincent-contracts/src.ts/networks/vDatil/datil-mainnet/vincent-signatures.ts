/**
 * Generated Contract Method Signatures for Vincent SDK
 * This file is auto-generated. DO NOT EDIT UNLESS YOU KNOW WHAT YOU'RE DOING.
 */

export const vincentDiamondAddress = '0x87cD7840425Fe836ea5fEc2b8Dea40149042AdCe';

export const vincentSignatures = {
  "VincentToolFacet": {
    "address": "0xe56ab2e80fff45e7692a1e28c715b2515e8847ff",
    "methods": {
      "approveTools": {
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
      "registerTools": {
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
      "removeToolApprovals": {
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
      "updateApprovedToolsManager": {
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
      }
    },
    "events": [
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
      }
    ]
  },
  "VincentToolViewFacet": {
    "address": "0x9c12da5660980e33488267bb1e41e9f5beb3dfee",
    "methods": {
      "getAllApprovedTools": {
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
      "getApprovedToolsManager": {
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
      "getToolIpfsCidByHash": {
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
      "isToolApproved": {
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
      }
    },
    "events": []
  },
  "VincentAppViewFacet": {
    "address": "0xb208465a1de6eae8fdfd922ab738fd9ec82ba653",
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
    "events": []
  },
  "VincentUserViewFacet": {
    "address": "0x7e3f021e2c22afdf0e660b611113b3a7e098948c",
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
    "events": []
  },
  "VincentAppFacet": {
    "address": "0x7a65adf3ccb1c985357b96410e8524ce0c204e66",
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
      }
    ]
  },
  "VincentUserFacet": {
    "address": "0x8c5e234a071b8714fbbc6f67ba5867136edc66ec",
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
    ]
  }
} as const;
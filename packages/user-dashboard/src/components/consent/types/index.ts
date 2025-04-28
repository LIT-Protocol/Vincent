import { IRelayPKP, SessionSigs } from '@lit-protocol/types';
import { BigNumber } from 'ethers';

export interface AuthenticatedConsentFormProps {
  userPKP: IRelayPKP;
  sessionSigs: SessionSigs;
  agentPKP?: IRelayPKP;
}

export interface AppView {
  name: string;
  description: string;
  manager: string;
  latestVersion: BigNumber | number;
  delegatees: string[] | any[];
  authorizedRedirectUris: string[];
  deploymentStatus?: number; // 0: DEV, 1: TEST, 2: PROD
}

export interface VersionParameter {
  toolIndex: number;
  policyIndex: number;
  paramIndex: number;
  name: string;
  type: number;
  value: any;
}

export interface PolicyParameter {
  name: string;
  paramType: number;
  value: string;
}

export interface PolicyWithParameters {
  policyIpfsCid: string;
  parameters: PolicyParameter[];
}

export interface ToolWithPolicies {
  toolIpfsCid: string;
  policies: PolicyWithParameters[];
}

/**
 * Represents a BigNumber in hex format
 */
interface BigNumberHex {
  type: "BigNumber";
  hex: string;
}

/**
 * Structure returned by getAppVersion from the VincentAppViewFacet contract
 * Based on the ABI structure - getAppVersion returns {app, appVersion}
 * This represents the already processed/normalized form of the data.
 */
export interface VersionInfo {
  app: {
    id: BigNumberHex;
    name: string;
    description: string;
    isDeleted: boolean;
    deploymentStatus: number;
    manager: string;
    latestVersion: BigNumberHex;
    delegatees: any[];
    authorizedRedirectUris: string[];
  };
  appVersion: {
    version: BigNumberHex;
    enabled: boolean;
    delegatedAgentPkpTokenIds: any[];
    tools: {
      toolIpfsCid: string;
      policies: {
        policyIpfsCid: string;
        parameterNames: string[];
        parameterTypes: number[];
      }[];
    }[];
  };
}

/**
 * The data is structured as an array with two elements (app and appVersion data)
 * while also having named properties that reference those same elements.
 */
export interface ContractVersionResult extends Array<any> {
  // Named properties for the top level array
  app: {
    0: BigNumberHex;  // id
    1: string;        // name
    2: string;        // description
    3: boolean;       // isDeleted
    4: number;        // deploymentStatus
    5: string;        // manager
    6: BigNumberHex;  // latestVersion
    7: any[];         // delegatees
    8: string[];      // authorizedRedirectUris
    
    // Named properties that match the positions
    id: BigNumberHex;
    name: string;
    description: string;
    isDeleted: boolean;
    deploymentStatus: number;
    manager: string;
    latestVersion: BigNumberHex;
    delegatees: any[];
    authorizedRedirectUris: string[];
  };
  
  appVersion: {
    0: BigNumberHex;  // version
    1: boolean;       // enabled
    2: any[];         // delegatedAgentPkpTokenIds
    3: Array<{
      0: string;      // toolIpfsCid
      1: Array<{
        0: string;    // policyIpfsCid
        1: string[];  // parameterNames
        2: number[];  // parameterTypes
        
        // Named properties that match the positions
        policyIpfsCid: string;
        parameterNames: string[];
        parameterTypes: number[];
      }>;
      
      // Named properties that match the positions
      toolIpfsCid: string;
      policies: Array<{
        policyIpfsCid: string;
        parameterNames: string[];
        parameterTypes: number[];
      }>;
    }>;
    
    // Named properties that match the positions
    version: BigNumberHex;
    enabled: boolean;
    delegatedAgentPkpTokenIds: any[];
    tools: Array<{
      toolIpfsCid: string;
      policies: Array<{
        policyIpfsCid: string;
        parameterNames: string[];
        parameterTypes: number[];
      }>;
    }>;
  };
}


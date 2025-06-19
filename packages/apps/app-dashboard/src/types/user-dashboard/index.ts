import { IRelayPKP, SessionSigs } from '@lit-protocol/types';
import { PolicyWithParameters, AppView } from '../shared';

interface AuthenticatedConsentFormProps {
  userPKP: IRelayPKP;
  sessionSigs: SessionSigs;
  agentPKP: IRelayPKP;
}

interface AppDetails {
  id: string;
  name: string;
  description?: string;
  deploymentStatus: number;
  version: number;
  isDeleted: boolean;
  showInfo?: boolean;
  infoMessage?: string;
  // API-specific fields
  logo?: string;
  appUserUrl?: string;
  contactEmail?: string;
  redirectUris?: string[];
  managerAddress?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface VersionParameter {
  toolIndex: number;
  policyIndex: number;
  paramIndex: number;
  name: string;
  type: number;
  value: string | number | boolean | null;
}

interface ToolWithPolicies {
  toolIpfsCid: string;
  policies: PolicyWithParameters[];
}

/**
 * Represents a BigNumber in hex format
 */
interface BigNumberHex {
  type: 'BigNumber';
  hex: string;
}

/**
 * Structure returned by getAppVersion from the VincentAppViewFacet contract
 * Based on the ABI structure - getAppVersion returns {app, appVersion}
 * This represents the already processed/normalized form of the data.
 */
interface VersionInfo {
  app: {
    id: BigNumberHex;
    name: string;
    description: string;
    isDeleted: boolean;
    deploymentStatus: number;
    manager: string;
    latestVersion: BigNumberHex;
    delegatees: unknown[];
    authorizedRedirectUris: string[];
  };
  appVersion: {
    version: BigNumberHex;
    enabled: boolean;
    delegatedAgentPkpTokenIds: unknown[];
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
interface ContractVersionResult extends Array<unknown> {
  // Named properties for the top level array
  app: {
    0: BigNumberHex; // id
    1: string; // name
    2: string; // description
    3: boolean; // isDeleted
    4: number; // deploymentStatus
    5: string; // manager
    6: BigNumberHex; // latestVersion
    7: unknown[]; // delegatees
    8: string[]; // authorizedRedirectUris

    // Named properties that match the positions
    id: BigNumberHex;
    name: string;
    description: string;
    isDeleted: boolean;
    deploymentStatus: number;
    manager: string;
    latestVersion: BigNumberHex;
    delegatees: unknown[];
    authorizedRedirectUris: string[];
  };

  appVersion: {
    0: BigNumberHex; // version
    1: boolean; // enabled
    2: unknown[]; // delegatedAgentPkpTokenIds
    3: Array<{
      0: string; // toolIpfsCid
      1: Array<{
        0: string; // policyIpfsCid
        1: string[]; // parameterNames
        2: number[]; // parameterTypes

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
    delegatedAgentPkpTokenIds: unknown[];
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

export type {
  AuthenticatedConsentFormProps,
  AppView,
  AppDetails,
  VersionParameter,
  PolicyWithParameters,
  ToolWithPolicies,
  BigNumberHex,
  VersionInfo,
  ContractVersionResult,
};

import { createVincentPolicy } from '@lit-protocol/vincent-ability-sdk';
import { ethers } from 'ethers';

import {
  evalAllowResultSchema,
  evalDenyResultSchema,
  precheckAllowResultSchema,
  precheckDenyResultSchema,
  abilityParamsSchema,
  userParamsSchema,
} from './schemas';

export const vincentPolicy = createVincentPolicy({
  packageName: '@lit-protocol/vincent-policy-contract-whitelist' as const,

  abilityParamsSchema,
  userParamsSchema,

  precheckAllowResultSchema,
  precheckDenyResultSchema,

  evalAllowResultSchema,
  evalDenyResultSchema,

  precheck: async ({ abilityParams, userParams }, { allow, deny }) => {
    try {
      const { serializedTransaction } = abilityParams;
      const { whitelist } = userParams;

      const transaction = ethers.utils.parseTransaction(serializedTransaction);
      const { chainId, to: contractAddress, data } = transaction;
      const functionSelector = data.slice(0, 10);

      if (!contractAddress) {
        return deny({
          reason: 'to property of serialized transaction not provided',
        });
      }

      const chainWhitelist = whitelist[chainId];
      if (!chainWhitelist) {
        return deny({
          reason: 'Chain ID not whitelisted',
          chainId,
          contractAddress,
          functionSelector,
        });
      }

      const functionWhitelist = chainWhitelist[contractAddress];
      if (!functionWhitelist) {
        return deny({
          reason: 'Function selector not whitelisted',
          chainId,
          contractAddress,
          functionSelector,
        });
      }

      const hasSpecificSelector = functionWhitelist.functionSelectors.includes(functionSelector);
      const hasWildcard = functionWhitelist.functionSelectors.includes('*');

      if (!hasSpecificSelector && !hasWildcard) {
        return deny({
          reason: 'Function selector not whitelisted',
          chainId,
          contractAddress,
          functionSelector,
        });
      }

      return allow({
        chainId,
        contractAddress,
        functionSelector,
        wildcardUsed: hasWildcard && !hasSpecificSelector,
      });
    } catch (error) {
      console.error('Precheck error:', error);
      return deny({
        reason: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },
  evaluate: async ({ abilityParams, userParams }, { allow, deny }) => {
    try {
      const { serializedTransaction } = abilityParams;
      const { whitelist } = userParams;

      const transaction = ethers.utils.parseTransaction(serializedTransaction);
      const { chainId, to: contractAddress, data } = transaction;
      const functionSelector = data.slice(0, 10);

      if (!contractAddress) {
        return deny({
          reason: 'to property of serialized transaction not provided',
        });
      }

      const chainWhitelist = whitelist[chainId];
      if (!chainWhitelist) {
        return deny({
          reason: 'Chain ID not whitelisted',
          chainId,
          contractAddress,
          functionSelector,
        });
      }

      const functionWhitelist = chainWhitelist[contractAddress];
      if (!functionWhitelist) {
        return deny({
          reason: 'Function selector not whitelisted',
          chainId,
          contractAddress,
          functionSelector,
        });
      }

      const hasSpecificSelector = functionWhitelist.functionSelectors.includes(functionSelector);
      const hasWildcard = functionWhitelist.functionSelectors.includes('*');

      if (!hasSpecificSelector && !hasWildcard) {
        return deny({
          reason: 'Function selector not whitelisted',
          chainId,
          contractAddress,
          functionSelector,
        });
      }

      return allow({
        chainId,
        contractAddress,
        functionSelector,
        wildcardUsed: hasWildcard && !hasSpecificSelector,
      });
    } catch (error) {
      console.error('Precheck error:', error);
      return deny({
        reason: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },
});

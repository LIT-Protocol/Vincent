import { createVincentPolicy } from '@lit-protocol/vincent-tool-sdk';
import { ethers } from 'ethers';

import {
  evalAllowResultSchema,
  evalDenyResultSchema,
  precheckAllowResultSchema,
  precheckDenyResultSchema,
  toolParamsSchema,
  userParamsSchema,
} from './schemas';

export const vincentPolicy = createVincentPolicy({
  packageName: '@lit-protocol/vincent-policy-contract-whitelist' as const,

  toolParamsSchema,
  userParamsSchema,

  precheckAllowResultSchema,
  precheckDenyResultSchema,

  evalAllowResultSchema,
  evalDenyResultSchema,

  precheck: async ({ toolParams, userParams }, { allow, deny }) => {
    try {
      const { serializedTransaction } = toolParams;
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

      if (!functionWhitelist.functionSelectors.includes(functionSelector)) {
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
      });
    } catch (error) {
      console.error('Precheck error:', error);
      return deny({
        reason: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },
  evaluate: async ({ toolParams, userParams }, { allow, deny }) => {
    try {
      const { serializedTransaction } = toolParams;
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

      if (!functionWhitelist.functionSelectors.includes(functionSelector)) {
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
      });
    } catch (error) {
      console.error('Precheck error:', error);
      return deny({
        reason: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },
});

import {
  createVincentAbility,
  supportedPoliciesForAbility,
} from '@lit-protocol/vincent-ability-sdk';

import {
  executeFailSchema,
  executeSuccessSchema,
  precheckFailSchema,
  precheckSuccessSchema,
  abilityParamsSchema,
  MorphoOperation,
} from './schemas';

import {
  ERC4626_VAULT_ABI,
  ERC20_ABI,
  isValidAddress,
  parseAmount,
  validateOperationRequirements,
  executeMorphoOperation,
} from './helpers';
import { ethers } from 'ethers';

export const vincentAbility = createVincentAbility({
  packageName: '@lit-protocol/vincent-ability-morpho' as const,
  abilityDescription: 'Withdraw, deposit, or redeem from a Morpho Vault.' as const,
  abilityParamsSchema,
  supportedPolicies: supportedPoliciesForAbility([]),

  precheckSuccessSchema,
  precheckFailSchema,

  executeSuccessSchema,
  executeFailSchema,

  precheck: async ({ abilityParams }, { succeed, fail, delegation: { delegatorPkpInfo } }) => {
    try {
      console.log('[@lit-protocol/vincent-ability-morpho/precheck]');
      console.log('[@lit-protocol/vincent-ability-morpho/precheck] params:', {
        abilityParams,
      });

      const { operation, vaultAddress, amount, onBehalfOf, rpcUrl } = abilityParams;

      // Validate operation
      if (!Object.values(MorphoOperation).includes(operation)) {
        return fail({
          error:
            '[@lit-protocol/vincent-ability-morpho/precheck] Invalid operation. Must be deposit, withdraw, or redeem',
        });
      }

      // Validate vault address
      if (!isValidAddress(vaultAddress)) {
        return fail({
          error: '[@lit-protocol/vincent-ability-morpho/precheck] Invalid vault address format',
        });
      }

      // Validate amount
      if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        return fail({
          error:
            '[@lit-protocol/vincent-ability-morpho/precheck] Invalid amount format or amount must be greater than 0',
        });
      }

      // Enhanced validation - connect to blockchain and validate everything the execute function would need
      console.log(
        '[@lit-protocol/vincent-ability-morpho/precheck] Starting enhanced validation...',
      );

      if (!rpcUrl) {
        return fail({
          error: '[@lit-protocol/vincent-ability-morpho/precheck] RPC URL is required for precheck',
        });
      }

      // Get provider
      let provider: ethers.providers.JsonRpcProvider;
      try {
        provider = new ethers.providers.JsonRpcProvider(rpcUrl);
      } catch (error) {
        return fail({
          error: `[@lit-protocol/vincent-ability-morpho/precheck] Unable to obtain blockchain provider: ${
            error instanceof Error ? error.message : String(error)
          }`,
        });
      }

      // Get PKP address
      const pkpAddress = delegatorPkpInfo.ethAddress;

      // Get vault info and validate vault exists
      let vaultAssetAddress: string;
      let assetDecimals: number;
      let userBalance = '0';
      let allowance = '0';
      let vaultShares = '0';

      try {
        const vaultContract = new ethers.Contract(vaultAddress, ERC4626_VAULT_ABI, provider);
        vaultAssetAddress = await vaultContract.asset();
        vaultShares = (await vaultContract.balanceOf(pkpAddress)).toString();

        const assetContract = new ethers.Contract(vaultAssetAddress, ERC20_ABI, provider);
        userBalance = (await assetContract.balanceOf(pkpAddress)).toString();
        allowance = (await assetContract.allowance(pkpAddress, vaultAddress)).toString();

        if (operation === MorphoOperation.REDEEM) {
          // we're redeeming shares, so need to use the decimals from the shares contract, not the assets contract
          assetDecimals = await vaultContract.decimals();
        } else {
          assetDecimals = await assetContract.decimals();
        }
      } catch (error) {
        return fail({
          error: `[@lit-protocol/vincent-ability-morpho/precheck] Invalid vault address or vault not found on network: ${error}`,
        });
      }

      // Convert amount using proper decimals
      const convertedAmount = parseAmount(amount, assetDecimals);

      // Operation-specific validations
      const operationChecks = await validateOperationRequirements(
        operation,
        userBalance,
        allowance,
        vaultShares,
        convertedAmount,
      );

      if (!operationChecks.valid) {
        return fail({
          error: `[@lit-protocol/vincent-ability-morpho/precheck] ${operationChecks.error}`,
        });
      }

      // Estimate gas for the operation
      let estimatedGas = 0;
      try {
        const vaultContract = new ethers.Contract(vaultAddress, ERC4626_VAULT_ABI, provider);
        const targetAddress = onBehalfOf || pkpAddress;

        switch (operation) {
          case MorphoOperation.DEPOSIT:
            estimatedGas = (
              await vaultContract.estimateGas.deposit(convertedAmount, targetAddress, {
                from: pkpAddress,
              })
            ).toNumber();
            break;
          case MorphoOperation.WITHDRAW:
            estimatedGas = (
              await vaultContract.estimateGas.withdraw(convertedAmount, pkpAddress, pkpAddress, {
                from: pkpAddress,
              })
            ).toNumber();
            break;
          case MorphoOperation.REDEEM:
            estimatedGas = (
              await vaultContract.estimateGas.redeem(convertedAmount, pkpAddress, pkpAddress, {
                from: pkpAddress,
              })
            ).toNumber();
            break;
        }
      } catch (error) {
        console.warn(
          '[@lit-protocol/vincent-ability-morpho/precheck] Gas estimation failed:',
          error,
        );
        return fail({
          error: `[@lit-protocol/vincent-ability-morpho/precheck] Gas estimation failed: ${
            error instanceof Error ? error.message : String(error)
          }`,
        });
      }

      // Enhanced validation passed
      const successResult = {
        operationValid: true,
        vaultValid: true,
        amountValid: true,
        userBalance,
        allowance,
        vaultShares,
        estimatedGas,
      };

      console.log(
        '[@lit-protocol/vincent-ability-morpho/precheck] Enhanced validation successful:',
        successResult,
      );

      return succeed(successResult);
    } catch (error) {
      console.error('[@lit-protocol/vincent-ability-morpho/precheck] Error:', error);
      return fail({
        error: `[@lit-protocol/vincent-ability-morpho/precheck] Validation failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      });
    }
  },

  execute: async ({ abilityParams }, { succeed, fail, delegation }) => {
    try {
      const {
        operation,
        vaultAddress,
        amount,
        onBehalfOf,
        chain,
        rpcUrl,
        alchemyGasSponsor,
        alchemyGasSponsorApiKey,
        alchemyGasSponsorPolicyId,
      } = abilityParams;

      console.log('[@lit-protocol/vincent-ability-morpho/execute] Executing Morpho Ability', {
        operation,
        vaultAddress,
        amount,
        chain,
      });

      if (rpcUrl) {
        return fail({
          error:
            '[@lit-protocol/vincent-ability-morpho/execute] RPC URL is not permitted for execute. Use the `chain` parameter, and the Lit Nodes will provide the RPC URL for you with the Lit.Actions.getRpcUrl() function',
        });
      }

      if (alchemyGasSponsor && (!alchemyGasSponsorApiKey || !alchemyGasSponsorPolicyId)) {
        return fail({
          error:
            '[@lit-protocol/vincent-ability-morpho/execute] Alchemy gas sponsor is enabled, but missing Alchemy API key or policy ID',
        });
      }

      // Get provider
      let provider: ethers.providers.JsonRpcProvider;
      try {
        provider = new ethers.providers.JsonRpcProvider(await Lit.Actions.getRpcUrl({ chain }));
      } catch (error) {
        console.error('[@lit-protocol/vincent-ability-morpho/execute] Provider error:', error);
        throw new Error('Unable to obtain blockchain provider for Morpho operations');
      }

      const { chainId } = await provider.getNetwork();

      // Get vault asset address and decimals
      const vaultContract = new ethers.Contract(vaultAddress, ERC4626_VAULT_ABI, provider);
      const vaultAssetAddress = await vaultContract.asset();
      const assetContract = new ethers.Contract(vaultAssetAddress, ERC20_ABI, provider);
      let assetDecimals: number;
      if (operation === MorphoOperation.REDEEM) {
        // we're redeeming shares, so need to use the decimals from the shares contract, not the assets contract
        assetDecimals = await vaultContract.decimals();
      } else {
        assetDecimals = await assetContract.decimals();
      }

      console.log('[@lit-protocol/vincent-ability-morpho/execute] Asset decimals:', assetDecimals);
      const convertedAmount = parseAmount(amount, assetDecimals);
      console.log(
        '[@lit-protocol/vincent-ability-morpho/execute] Converted amount:',
        convertedAmount,
      );

      // Get PKP public key from delegation context
      const pkpPublicKey = delegation.delegatorPkpInfo.publicKey;
      if (!pkpPublicKey) {
        throw new Error('PKP public key not available from delegation context');
      }

      // Get PKP address using ethers utils
      const pkpAddress = ethers.utils.computeAddress(pkpPublicKey);
      console.log('[@lit-protocol/vincent-ability-morpho/execute] PKP Address:', pkpAddress);

      // Prepare transaction based on operation
      let functionName: string;
      let args: any[];

      switch (operation) {
        case MorphoOperation.DEPOSIT:
          functionName = 'deposit';
          args = [convertedAmount, onBehalfOf || pkpAddress];
          break;

        case MorphoOperation.WITHDRAW:
          functionName = 'withdraw';
          args = [convertedAmount, pkpAddress, pkpAddress];
          break;

        case MorphoOperation.REDEEM:
          functionName = 'redeem';
          args = [convertedAmount, pkpAddress, pkpAddress];
          break;

        default:
          throw new Error(`Unsupported operation: ${operation}`);
      }

      // Execute the operation using the unified function
      const txHash = await executeMorphoOperation({
        provider,
        pkpPublicKey,
        vaultAddress,
        functionName,
        args,
        chainId,
        alchemyGasSponsor,
        alchemyGasSponsorApiKey,
        alchemyGasSponsorPolicyId,
      });

      console.log('[@lit-protocol/vincent-ability-morpho/execute] Morpho operation successful', {
        txHash,
        operation,
        vaultAddress,
        amount,
      });

      return succeed({
        txHash,
        operation,
        vaultAddress,
        amount,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error(
        '[@lit-protocol/vincent-ability-morpho/execute] Morpho operation failed',
        error,
      );

      return fail({
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  },
});

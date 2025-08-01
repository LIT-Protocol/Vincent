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
  MORPHO_MARKET_ABI,
  ERC20_ABI,
  isValidAddress,
  parseAmount,
  validateOperationRequirements,
  executeMorphoVaultOperation,
  executeMorphoMarketOperation,
} from './helpers';
import { ethers } from 'ethers';

export const vincentAbility = createVincentAbility({
  packageName: '@lit-protocol/vincent-ability-morpho' as const,
  abilityDescription:
    'Interact with Morpho Vaults (deposit, withdraw, redeem) and Markets (supply, withdrawCollateral).' as const,
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

      const { operation, contractAddress, marketId, amount, onBehalfOf, rpcUrl } = abilityParams;

      // Validate operation
      if (!Object.values(MorphoOperation).includes(operation)) {
        return fail({
          error:
            '[@lit-protocol/vincent-ability-morpho/precheck] Invalid operation. Must be vault_deposit, vault_withdraw, vault_redeem, market_supply, or market_withdrawCollateral',
        });
      }

      // Check if market operations have required marketId
      const isMarketOperation = [
        MorphoOperation.MARKET_SUPPLY,
        MorphoOperation.MARKET_WITHDRAW_COLLATERAL,
      ].includes(operation);
      if (isMarketOperation && !marketId) {
        return fail({
          error:
            '[@lit-protocol/vincent-ability-morpho/precheck] Market ID is required for market operations',
        });
      }

      // Validate contract address
      if (!isValidAddress(contractAddress)) {
        return fail({
          error: '[@lit-protocol/vincent-ability-morpho/precheck] Invalid contract address format',
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

      // Initialize variables
      let assetAddress: string;
      let assetDecimals: number;
      let userBalance = '0';
      let allowance = '0';
      let vaultShares = '0';
      let collateralBalance = '0';

      try {
        if (isMarketOperation) {
          // Handle market operations
          const marketContract = new ethers.Contract(contractAddress, MORPHO_MARKET_ABI, provider);

          // Get market params from marketId
          const marketParams = await marketContract.idToMarketParams(marketId);
          assetAddress =
            operation === MorphoOperation.MARKET_SUPPLY
              ? marketParams.loanToken
              : marketParams.collateralToken;

          // Get user position in the market
          const position = await marketContract.position(marketId, pkpAddress);
          collateralBalance = position.collateral.toString();

          // Get asset info
          const assetContract = new ethers.Contract(assetAddress, ERC20_ABI, provider);
          assetDecimals = await assetContract.decimals();
          userBalance = (await assetContract.balanceOf(pkpAddress)).toString();
          allowance = (await assetContract.allowance(pkpAddress, contractAddress)).toString();
        } else {
          // Handle vault operations
          const vaultContract = new ethers.Contract(contractAddress, ERC4626_VAULT_ABI, provider);
          assetAddress = await vaultContract.asset();
          vaultShares = (await vaultContract.balanceOf(pkpAddress)).toString();

          const assetContract = new ethers.Contract(assetAddress, ERC20_ABI, provider);
          userBalance = (await assetContract.balanceOf(pkpAddress)).toString();
          allowance = (await assetContract.allowance(pkpAddress, contractAddress)).toString();

          if (operation === MorphoOperation.VAULT_REDEEM) {
            // we're redeeming shares, so need to use the decimals from the shares contract, not the assets contract
            assetDecimals = await vaultContract.decimals();
          } else {
            assetDecimals = await assetContract.decimals();
          }
        }
      } catch (error) {
        return fail({
          error: `[@lit-protocol/vincent-ability-morpho/precheck] Invalid contract address or contract not found on network: ${error}`,
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
        collateralBalance,
      );

      if (!operationChecks.valid) {
        return fail({
          error: `[@lit-protocol/vincent-ability-morpho/precheck] ${operationChecks.error}`,
        });
      }

      // Estimate gas for the operation
      let estimatedGas = 0;
      try {
        const targetAddress = onBehalfOf || pkpAddress;

        if (isMarketOperation) {
          const marketContract = new ethers.Contract(contractAddress, MORPHO_MARKET_ABI, provider);
          const marketParams = await marketContract.idToMarketParams(marketId);
          const marketParamsTuple = [
            marketParams.loanToken,
            marketParams.collateralToken,
            marketParams.oracle,
            marketParams.irm,
            marketParams.lltv,
          ];

          switch (operation) {
            case MorphoOperation.MARKET_SUPPLY:
              estimatedGas = (
                await marketContract.estimateGas.supply(
                  marketParamsTuple,
                  convertedAmount,
                  0, // shares (0 means all assets)
                  targetAddress,
                  '0x', // empty data
                  { from: pkpAddress },
                )
              ).toNumber();
              break;
            case MorphoOperation.MARKET_WITHDRAW_COLLATERAL:
              estimatedGas = (
                await marketContract.estimateGas.withdrawCollateral(
                  marketParamsTuple,
                  convertedAmount,
                  pkpAddress,
                  pkpAddress,
                  { from: pkpAddress },
                )
              ).toNumber();
              break;
          }
        } else {
          const vaultContract = new ethers.Contract(contractAddress, ERC4626_VAULT_ABI, provider);

          switch (operation) {
            case MorphoOperation.VAULT_DEPOSIT:
              estimatedGas = (
                await vaultContract.estimateGas.deposit(convertedAmount, targetAddress, {
                  from: pkpAddress,
                })
              ).toNumber();
              break;
            case MorphoOperation.VAULT_WITHDRAW:
              estimatedGas = (
                await vaultContract.estimateGas.withdraw(convertedAmount, pkpAddress, pkpAddress, {
                  from: pkpAddress,
                })
              ).toNumber();
              break;
            case MorphoOperation.VAULT_REDEEM:
              estimatedGas = (
                await vaultContract.estimateGas.redeem(convertedAmount, pkpAddress, pkpAddress, {
                  from: pkpAddress,
                })
              ).toNumber();
              break;
          }
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
        contractValid: true,
        amountValid: true,
        userBalance,
        allowance,
        vaultShares: isMarketOperation ? undefined : vaultShares,
        collateralBalance: isMarketOperation ? collateralBalance : undefined,
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
        contractAddress,
        marketId,
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
        contractAddress,
        marketId,
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
      const isMarketOperation =
        operation === MorphoOperation.MARKET_SUPPLY ||
        operation === MorphoOperation.MARKET_WITHDRAW_COLLATERAL;

      // Get asset address and decimals
      let assetAddress: string;
      let assetDecimals: number;

      if (isMarketOperation) {
        const marketContract = new ethers.Contract(contractAddress, MORPHO_MARKET_ABI, provider);
        const marketParams = await marketContract.idToMarketParams(marketId);
        assetAddress =
          operation === MorphoOperation.MARKET_SUPPLY
            ? marketParams.loanToken
            : marketParams.collateralToken;
        const assetContract = new ethers.Contract(assetAddress, ERC20_ABI, provider);
        assetDecimals = await assetContract.decimals();
      } else {
        const vaultContract = new ethers.Contract(contractAddress, ERC4626_VAULT_ABI, provider);
        assetAddress = await vaultContract.asset();
        const assetContract = new ethers.Contract(assetAddress, ERC20_ABI, provider);
        if (operation === MorphoOperation.VAULT_REDEEM) {
          // we're redeeming shares, so need to use the decimals from the shares contract, not the assets contract
          assetDecimals = await vaultContract.decimals();
        } else {
          assetDecimals = await assetContract.decimals();
        }
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

      // Prepare and execute transaction based on operation type
      let txHash: string;

      if (isMarketOperation) {
        // Handle market operations
        const marketContract = new ethers.Contract(contractAddress, MORPHO_MARKET_ABI, provider);
        const marketParams = await marketContract.idToMarketParams(marketId);
        const marketParamsTuple = [
          marketParams.loanToken,
          marketParams.collateralToken,
          marketParams.oracle,
          marketParams.irm,
          marketParams.lltv,
        ];

        let functionName: string;
        let args: any[];

        switch (operation) {
          case MorphoOperation.MARKET_SUPPLY:
            functionName = 'supply';
            args = [
              marketParamsTuple,
              convertedAmount,
              0, // shares (0 means all assets)
              onBehalfOf || pkpAddress,
              '0x', // empty data
            ];
            break;

          case MorphoOperation.MARKET_WITHDRAW_COLLATERAL:
            functionName = 'withdrawCollateral';
            args = [marketParamsTuple, convertedAmount, pkpAddress, pkpAddress];
            break;

          default:
            throw new Error(`Unsupported market operation: ${operation}`);
        }

        txHash = await executeMorphoMarketOperation({
          provider,
          pkpPublicKey,
          marketAddress: contractAddress,
          marketId: marketId!,
          functionName,
          args,
          chainId,
          alchemyGasSponsor,
          alchemyGasSponsorApiKey,
          alchemyGasSponsorPolicyId,
        });
      } else {
        // Handle vault operations
        let functionName: string;
        let args: any[];

        switch (operation) {
          case MorphoOperation.VAULT_DEPOSIT:
            functionName = 'deposit';
            args = [convertedAmount, onBehalfOf || pkpAddress];
            break;

          case MorphoOperation.VAULT_WITHDRAW:
            functionName = 'withdraw';
            args = [convertedAmount, pkpAddress, pkpAddress];
            break;

          case MorphoOperation.VAULT_REDEEM:
            functionName = 'redeem';
            args = [convertedAmount, pkpAddress, pkpAddress];
            break;

          default:
            throw new Error(`Unsupported vault operation: ${operation}`);
        }

        txHash = await executeMorphoVaultOperation({
          provider,
          pkpPublicKey,
          vaultAddress: contractAddress,
          functionName,
          args,
          chainId,
          alchemyGasSponsor,
          alchemyGasSponsorApiKey,
          alchemyGasSponsorPolicyId,
        });
      }

      console.log('[@lit-protocol/vincent-ability-morpho/execute] Morpho operation successful', {
        txHash,
        operation,
        contractAddress,
        marketId,
        amount,
      });

      return succeed({
        txHash,
        operation,
        contractAddress,
        marketId: isMarketOperation ? marketId : undefined,
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

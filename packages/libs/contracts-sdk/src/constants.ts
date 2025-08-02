import appFacetAbi from '../abis/VincentAppFacet.abi.json';
import appViewFacetAbi from '../abis/VincentAppViewFacet.abi.json';
import userFacetAbi from '../abis/VincentUserFacet.abi.json';
import userViewFacetAbi from '../abis/VincentUserViewFacet.abi.json';
import { buildDiamondInterface } from './buildDiamondInterface';

// TODO!: Pull from the ABI after re-publishing
// FIXME: Ensure dev and prod point to different contracts
export const VINCENT_DIAMOND_CONTRACT_ADDRESS_DEV = '0x1A8d4afCD3a7Bf9b0Fc6Fe341cE745AC619aE304';
export const VINCENT_DIAMOND_CONTRACT_ADDRESS_PROD = '0x1A8d4afCD3a7Bf9b0Fc6Fe341cE745AC619aE304';

export const COMBINED_ABI = buildDiamondInterface([
  appFacetAbi,
  appViewFacetAbi,
  userFacetAbi,
  userViewFacetAbi,
]);

export const GAS_ADJUSTMENT_PERCENT = 120;

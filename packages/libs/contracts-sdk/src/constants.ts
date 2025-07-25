import appFacetAbi from '../abis/VincentAppFacet.abi.json';
import appViewFacetAbi from '../abis/VincentAppViewFacet.abi.json';
import userFacetAbi from '../abis/VincentUserFacet.abi.json';
import userViewFacetAbi from '../abis/VincentUserViewFacet.abi.json';
import { buildDiamondInterface } from './buildDiamondInterface';

// TODO!: Pull from the ABI after re-publishing
// FIXME: Ensure dev and prod point to different contracts
export const VINCENT_DIAMOND_CONTRACT_ADDRESS_DEV = '0xa1979393bbe7D59dfFBEB38fE5eCf9BDdFE6f4aD';
export const VINCENT_DIAMOND_CONTRACT_ADDRESS_PROD = '0xa1979393bbe7D59dfFBEB38fE5eCf9BDdFE6f4aD';

export const COMBINED_ABI = buildDiamondInterface([
  appFacetAbi,
  appViewFacetAbi,
  userFacetAbi,
  userViewFacetAbi,
]);

export const GAS_ADJUSTMENT_PERCENT = 120;

export const DEFAULT_PAGE_SIZE = 100;

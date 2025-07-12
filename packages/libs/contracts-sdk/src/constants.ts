import appFacetAbi from '../abis/VincentAppFacet.abi.json';
import appViewFacetAbi from '../abis/VincentAppViewFacet.abi.json';
import userFacetAbi from '../abis/VincentUserFacet.abi.json';
import userViewFacetAbi from '../abis/VincentUserViewFacet.abi.json';

// TODO!: Pull from the ABI after re-publishing
export const VINCENT_DIAMOND_CONTRACT_ADDRESS = '0xa1979393bbe7D59dfFBEB38fE5eCf9BDdFE6f4aD';

export const COMBINED_ABI = [
  ...appFacetAbi,
  ...appViewFacetAbi,
  ...userFacetAbi,
  ...userViewFacetAbi,
];

export const GAS_ADJUSTMENT_PERCENT = 120;

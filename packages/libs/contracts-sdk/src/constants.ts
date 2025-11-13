import appFacetAbi from '../abis/VincentAppFacet.abi.json';
import appViewFacetAbi from '../abis/VincentAppViewFacet.abi.json';
import userFacetAbi from '../abis/VincentUserFacet.abi.json';
import userViewFacetAbi from '../abis/VincentUserViewFacet.abi.json';
import { buildDiamondInterface } from './buildDiamondInterface';

// TODO!: Pull from the ABI after re-publishing
export const VINCENT_DIAMOND_CONTRACT_ADDRESS_DEV = '0x57f75581e0c9e51594C8080EcC833A3592A50df8';
export const VINCENT_DIAMOND_CONTRACT_ADDRESS_PROD = '0xa3a602F399E9663279cdF63a290101cB6560A87e';

export const COMBINED_ABI = buildDiamondInterface([
  appFacetAbi,
  appViewFacetAbi,
  userFacetAbi,
  userViewFacetAbi,
]);

export const GAS_ADJUSTMENT_PERCENT = 120;
export const DEFAULT_PAGE_SIZE = '50';

export const VINCENT_CONTRACT_ADDRESS_BOOK = {
  fee: {
    baseSepolia: {
      address: '0x35705D6ad235DcA39c10B6E0EfBA84b5E90D2aC9',
      salt: 'DatilSalt',
    },
  },
};

export const VINCENT_LIT_ACTIONS_ADDRESS_BOOK = {
  signOwnerAttestation: {
    ipfsCid: 'QmYAmbZBSZHJXbsZBjz8bcjvCwwSXxDv2DwPhqvD5gSvu9',
    derivedActionPubkey:
      '0472dee39340be90f6e51bacd31a1dc3445b02cfa1f1f93090be7cb7257140f4c7fdafd08babf81c44ace02482c605fad3b55bd9baf23c9c580b6203075a6fbaa0',
    derivedActionAddress: '0x1e74aD7eF0A72a105c2e624202ba21C72Dc5fbC1',
  },
};

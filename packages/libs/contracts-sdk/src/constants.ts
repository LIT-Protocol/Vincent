import feeDiamondAbi from '../abis/FeeDiamond.abi.json';
import appFacetAbi from '../abis/VincentAppFacet.abi.json';
import appViewFacetAbi from '../abis/VincentAppViewFacet.abi.json';
import erc2771FacetAbi from '../abis/VincentERC2771Facet.abi.json';
import userFacetAbi from '../abis/VincentUserFacet.abi.json';
import userViewFacetAbi from '../abis/VincentUserViewFacet.abi.json';
import { buildDiamondInterface } from './buildDiamondInterface';

// TODO!: Pull from the ABI after re-publishing
export const VINCENT_DIAMOND_CONTRACT_ADDRESS_PROD = '0x1599E2c248C34833A606EB1dFeA86b839170d49f';

export const COMBINED_ABI = buildDiamondInterface([
  appFacetAbi,
  appViewFacetAbi,
  userFacetAbi,
  userViewFacetAbi,
  erc2771FacetAbi,
]);

export const GAS_ADJUSTMENT_PERCENT = 120;
export const DEFAULT_PAGE_SIZE = '50';

export const VINCENT_CONTRACT_ADDRESS_BOOK = {
  fee: {
    175188: {
      chainName: 'chronicleYellowstone',
      address: '0x1599E2c248C34833A606EB1dFeA86b839170d49f',
      salt: 'VincentCreate2Salt_2',
    },
    8453: {
      chainName: 'base',
      address: '0x1599E2c248C34833A606EB1dFeA86b839170d49f',
      salt: 'VincentCreate2Salt_2',
    },
    84532: {
      chainName: 'baseSepolia',
      address: '0x1599E2c248C34833A606EB1dFeA86b839170d49f',
      salt: 'VincentCreate2Salt_2',
    },
  },
};

export const VINCENT_LIT_ACTIONS_ADDRESS_BOOK = {
  signOwnerAttestation: {
    ipfsCid: 'QmfBfiD5XFQAagwcYgCEncpssvQJYkosbbww53t7EmEKdE',
    derivedActionPubkey:
      '0x0457611cae6d4c24e0f6d963181f503e56b308a8df43fc71584f2f586e8322ae3063a78a494e8fa1fdbca34b9dd2e2778b19eba5e7d54987148621e768b25ca9d3',
    derivedActionAddress: '0x32a2F1243F2402166c95Ef64b2a6ED932B04b7dC',
  },
};

export { feeDiamondAbi as FEE_DIAMOND_ABI };

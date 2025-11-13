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
    ipfsCid: 'QmPLtPzAnXE4V49avASEPgX4vZFEHRiDxig486DSV5CFpu',
    derivedActionPubkey:
      '0x04fd72e0d918ca50d0e7d94916e9e013e5bdb0806733e13b23fc266fce77ced01f1e9b85098e575061c9e617921365e058fb25c26a3e7e6130bc85e3a8e726af8a',
    derivedActionAddress: '0x3A87716A042FFEfF7905Fb624f25cAB996FdECEb',
  },
};

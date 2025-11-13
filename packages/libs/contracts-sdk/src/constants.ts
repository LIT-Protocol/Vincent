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
    ipfsCid: 'Qmbe1YYbHBhuLeL1B7mEEaNe5NsuzRLJT6rLzpVsX1QcUF',
    derivedActionPubkey:
      '0x04c627cfef151424c26223637d08db22fb5e4fd874a1d658799e941ed396c3fb49a741499da92956d73b23c6fa165d192434608d57de86487818109468115183bd',
    derivedActionAddress: '0x58Bc270c67F9f3121fBdF20982120bBa62A47884',
  },
};

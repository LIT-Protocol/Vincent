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
    ipfsCid: 'QmSWgViHHR1yZ7tGKZMCdHHCZrA6WpXrExshGaQBWiPpfe',
    derivedActionPubkey:
      '047f155c9e782039b3be6554619b665a15223ebbd278724024563d8a01daac67dd507916d41e1ca7fb2128df039640781148fbb1020a54bab2eafbae77dbad6a87',
    derivedActionAddress: '0x22d32f0355A7914665220dD7ff5f1983021CC2B0',
  },
};

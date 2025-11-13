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
    ipfsCid: 'QmUrybuAq6o9F6UWZRKdCHFgyJaE2xRfE4H1LPKJbvZq1i',
    derivedActionPubkey:
      '0417d1c84b3462fde044506d5724930497e41771b534a599e1cf29501595a1a8b2cc98a828548c633500074271a9cd52b75da369b19fe4ea00e2568ed84e3e3d08',
    derivedActionAddress: '0xb1a00C1Ac5fa7AEc678B6ea16e6b7113a035B499',
  },
};

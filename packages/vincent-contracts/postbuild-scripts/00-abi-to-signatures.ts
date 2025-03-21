import { abiToSignatures } from "./utils/abiToSignatures";

const targetAndOutputDir = [
  {
    target: './broadcast/DeployVincentDiamond.sol/175188/deployToDatil-latest.json',
    outputDir: './src.ts/networks/vDatil/datil-mainnet'
  },

  // ... other networks
  // {
  //   target: './broadcast/DeployVincentDiamond.sol/175188/deployToNaga-latest.json',
  //   outputDir: './networks/vNaga/naga-mainnet'
  // }
]

targetAndOutputDir.forEach(({ target, outputDir }) => {
  console.log(`Generating signatures for ${target} to ${outputDir}`);
  abiToSignatures(target, outputDir);
});

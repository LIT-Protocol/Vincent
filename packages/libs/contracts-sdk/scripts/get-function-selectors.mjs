import { spawnSync } from 'child_process';
import process from 'process';

import { ethers } from 'ethers';

function getSelectors(contract) {
  // Run: forge inspect --json <contract> mi
  const res = spawnSync('forge', ['inspect', '--json', contract, 'mi'], { encoding: 'utf-8' });

  if (res.error) {
    console.error('Error running forge:', res.error);
    process.exit(1);
  }
  if (res.status !== 0) {
    console.error('forge exited with code', res.status);
    console.error(res.stderr);
    process.exit(res.status);
  }

  let output;
  try {
    output = JSON.parse(res.stdout);
  } catch (e) {
    console.error('Failed to parse forge output as JSON:', e);
    process.exit(1);
  }

  const selectors = [];
  for (const signature in output) {
    const selector = output[signature];
    selectors.push('0x' + selector);
  }

  //   console.log('Selectors:', selectors);

  // eth-abi encode for bytes4[]
  const encoded = ethers.utils.defaultAbiCoder.encode(['bytes4[]'], [selectors]);
  console.log(encoded);
}

function main() {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error('Usage: node getFunctionSelectors.mjs <ContractName>');
    process.exit(1);
  }
  const contract = args[0];
  //   console.log('Getting function selectors for', contract);
  getSelectors(contract);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

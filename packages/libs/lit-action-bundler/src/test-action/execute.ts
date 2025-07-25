 
import { ethers } from 'ethers';

import { generateVincentToolSessionSigs } from '../LitNodeClient/generateVincentToolSessionSigs';
import { getLitNodeClientInstance } from '../LitNodeClient/getLitNodeClient';
// @ts-expect-error yes, there are no types for the IIFE
import { code } from './generated/lit-action.js';

const signer = new ethers.Wallet(process.env['TEST_APP_MANAGER_PRIVATE_KEY']!);

async function gogo() {
  const litNodeClient = await getLitNodeClientInstance({ network: 'datil' });

  const sessionSigs = await generateVincentToolSessionSigs({
    litNodeClient,
    ethersSigner: signer,
  });

  return litNodeClient.executeJs({
    sessionSigs,
    jsParams: { wat: 'beef' },
    code,
  });
}

gogo();

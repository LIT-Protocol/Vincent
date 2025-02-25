#!/usr/bin/env node

import { config } from '@dotenvx/dotenvx';
import { Command } from 'commander';

// Load environment variables
config();

const program = new Command();

// Constants
const DATIL_RELAYER_URL = 'https://datil-relayer.getlit.dev';
const DATIL_TEST_RELAYER_URL = 'https://datil-test-relayer.getlit.dev';

interface RegisterPayerResponse {
  payerSecretKey: string;
  payerWalletAddress: string;
}

interface AddUserResponse {
  success: boolean;
  error?: string;
}

function validateEnvVars() {
  const required = [
    'LIT_RELAYER_API_KEY',
    'LIT_NETWORK',
    'LIT_PAYER_SECRET_KEY',
    'LIT_PAYER_WALLET_ADDRESS',
  ];

  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }

  if (!['datil', 'datil-test'].includes(process.env.LIT_NETWORK!)) {
    throw new Error('LIT_NETWORK must be either "datil" or "datil-test"');
  }
}

async function registerPayer(): Promise<RegisterPayerResponse> {
  const network = process.env.LIT_NETWORK!;
  const relayerUrl =
    network === 'datil' ? DATIL_RELAYER_URL : DATIL_TEST_RELAYER_URL;
  const apiKey = process.env.LIT_RELAYER_API_KEY;

  const response = await fetch(`${relayerUrl}/register-payer`, {
    method: 'POST',
    headers: {
      'api-key': apiKey!,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Error registering payer: ${await response.text()}`);
  }

  return response.json();
}

async function addDelegatees(delegatees: string[]): Promise<void> {
  validateEnvVars();

  const network = process.env.LIT_NETWORK!;
  const relayerUrl =
    network === 'datil' ? DATIL_RELAYER_URL : DATIL_TEST_RELAYER_URL;

  const response = await fetch(`${relayerUrl}/add-users`, {
    method: 'POST',
    headers: {
      'api-key': process.env.LIT_RELAYER_API_KEY!,
      'payer-secret-key': process.env.LIT_PAYER_SECRET_KEY!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(delegatees),
  });

  if (!response.ok) {
    throw new Error(`Error adding delegatees: ${await response.text()}`);
  }

  const data = (await response.json()) as AddUserResponse;
  if (!data.success) {
    throw new Error(`Failed to add delegatees: ${data.error}`);
  }
}

// CLI Commands
program
  .name('lit-payer-wallet')
  .description('CLI to manage Lit Protocol payer wallets and delegatees')
  .version('0.0.1');

program
  .command('init')
  .description('Initialize a new payer wallet')
  .action(async () => {
    try {
      if (!process.env.LIT_RELAYER_API_KEY) {
        throw new Error('LIT_RELAYER_API_KEY environment variable is not set');
      }
      if (!process.env.LIT_NETWORK) {
        throw new Error('LIT_NETWORK environment variable is not set');
      }

      console.log(
        `Initializing new payer wallet on ${process.env.LIT_NETWORK}...`
      );
      const { payerSecretKey, payerWalletAddress } = await registerPayer();

      console.log(`Payer wallet created successfully!`);
      console.log(`Wallet address: ${payerWalletAddress}`);
      console.log('\nAdd these environment variables to your .env file:');
      console.log(`LIT_PAYER_SECRET_KEY=${payerSecretKey}`);
      console.log(`LIT_PAYER_WALLET_ADDRESS=${payerWalletAddress}`);
      console.log(
        '\nWarning: Keep your secret key secure and never commit it to version control'
      );
    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  });

program
  .command('add-delegatees')
  .description('Add delegatees to the payer wallet')
  .argument('<addresses>', 'Comma-separated list of Ethereum addresses')
  .action(async (addresses: string) => {
    try {
      const delegatees = addresses.split(',').map((addr) => addr.trim());

      // Validate addresses
      const addressRegex = /^0x[a-fA-F0-9]{40}$/;
      for (const addr of delegatees) {
        if (!addressRegex.test(addr)) {
          throw new Error(`Invalid Ethereum address: ${addr}`);
        }
      }

      console.log('Adding delegatees...');
      await addDelegatees(delegatees);
      console.log('Delegatees added successfully!');
    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  });

program
  .command('show-config')
  .description('Show current payer wallet configuration')
  .action(async () => {
    try {
      validateEnvVars();

      console.log('Current Configuration:');
      console.log('Network:', process.env.LIT_NETWORK);
      console.log(
        'Payer Wallet Address:',
        process.env.LIT_PAYER_WALLET_ADDRESS
      );
    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  });

program.parse();

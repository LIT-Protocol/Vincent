import { encryptPrivateKey } from '../../internal/common/encryptKey';
import { generateSolanaPrivateKey } from '../../internal/solana/generatePrivateKey';

interface Action {
  network: 'solana';
  generateKeyParams: {
    memo: string;
  };
}

export interface BatchGenerateEncryptedKeysParams {
  actions: Action[];
  accessControlConditions: string;
}

async function processSolanaAction({
  action,
  accessControlConditions,
}: {
  action: Action;
  accessControlConditions: string;
}) {
  const { network, generateKeyParams } = action;

  const solanaKey = generateSolanaPrivateKey();

  const generatedPrivateKey = await encryptPrivateKey({
    accessControlConditions,
    publicKey: solanaKey.publicKey,
    privateKey: solanaKey.privateKey,
  });

  return {
    network,
    generateEncryptedPrivateKey: {
      ...generatedPrivateKey,
      memo: generateKeyParams.memo,
    },
  };
}

async function processActions({
  actions,
  accessControlConditions,
}: BatchGenerateEncryptedKeysParams) {
  return Promise.all(
    actions.map(async (action, ndx) => {
      const { network } = action;

      if (network === 'solana') {
        return await processSolanaAction({
          action,
          accessControlConditions,
        });
      } else {
        throw new Error(`Invalid network for action[${ndx}]: ${network}`);
      }
    }),
  );
}

function validateParams(actions: Action[]) {
  if (!actions) {
    throw new Error('Missing required field: actions');
  }

  if (!actions.length) {
    throw new Error('No actions provided (empty array?)');
  }

  actions.forEach((action, ndx) => {
    if (!['solana'].includes(action.network)) {
      throw new Error(`Invalid field: actions[${ndx}].network: ${action.network}`);
    }

    if (!action.generateKeyParams) {
      throw new Error(`Missing required field: actions[${ndx}].generateKeyParams`);
    }

    if (!action.generateKeyParams?.memo) {
      throw new Error(`Missing required field: actions[${ndx}].generateKeyParams.memo`);
    }
  });
}

export async function batchGenerateEncryptedKeys({
  actions,
  accessControlConditions,
}: BatchGenerateEncryptedKeysParams) {
  validateParams(actions);

  return processActions({
    actions,
    accessControlConditions,
  });
}

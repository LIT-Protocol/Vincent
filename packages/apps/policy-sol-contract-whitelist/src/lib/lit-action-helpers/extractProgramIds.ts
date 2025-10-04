import { Transaction, VersionedTransaction } from '@solana/web3.js';

export function extractProgramIds(transaction: Transaction | VersionedTransaction): string[] {
  const programIds = new Set<string>();

  if (transaction instanceof Transaction) {
    // Legacy transaction
    for (const instruction of transaction.instructions) {
      programIds.add(instruction.programId.toBase58());
    }
    return Array.from(programIds);
  }

  // Versioned transaction
  const message = transaction.message;
  const staticKeys = message.staticAccountKeys;

  for (const instruction of message.compiledInstructions) {
    const programIdIndex = instruction.programIdIndex;

    // Program IDs are always in staticAccountKeys, never in ALTs
    if (programIdIndex < 0 || programIdIndex >= staticKeys.length) {
      throw new Error('Malformed v0 message: programIdIndex out of staticAccountKeys range');
    }

    programIds.add(staticKeys[programIdIndex].toBase58());
  }

  return Array.from(programIds);
}

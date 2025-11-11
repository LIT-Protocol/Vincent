import type { SignOwnerAttestationParams } from '../raw-action-functions/signOwnerAttestation';
import { signOwnerAttestationAction } from '../raw-action-functions/signOwnerAttestation';

// Using local declarations to avoid _every file_ thinking these are always in scope
declare const srcChainId: SignOwnerAttestationParams['srcChainId'];
declare const srcContract: SignOwnerAttestationParams['srcContract'];
declare const owner: SignOwnerAttestationParams['owner'];
declare const appId: SignOwnerAttestationParams['appId'];
declare const dstChainId: SignOwnerAttestationParams['dstChainId'];
declare const dstContract: SignOwnerAttestationParams['dstContract'];
declare const pkpPublicKey: SignOwnerAttestationParams['pkpPublicKey'];
declare const chronicleYellowstoneRpcUrl: SignOwnerAttestationParams['chronicleYellowstoneRpcUrl'];
declare const attestationValiditySeconds: SignOwnerAttestationParams['attestationValiditySeconds'];

// Lit Action handler wrapper
declare const Lit: {
  Actions: {
    setResponse: (params: { response: string }) => void;
  };
};

async function litActionHandler(actionFunc: () => Promise<unknown>) {
  try {
    const litActionResult = await actionFunc();
    // Don't re-stringify a string; we don't want to double-escape it
    const response =
      typeof litActionResult === 'string' ? litActionResult : JSON.stringify(litActionResult);

    Lit.Actions.setResponse({ response });
  } catch (err: unknown) {
    Lit.Actions.setResponse({ response: `Error: ${(err as Error).message}` });
  }
}

(async () =>
  litActionHandler(async () =>
    signOwnerAttestationAction({
      srcChainId,
      srcContract,
      owner,
      appId,
      dstChainId,
      dstContract,
      pkpPublicKey,
      chronicleYellowstoneRpcUrl,
      attestationValiditySeconds,
    }),
  ))();

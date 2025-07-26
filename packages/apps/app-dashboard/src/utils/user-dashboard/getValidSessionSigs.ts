import { LitPKPResource } from '@lit-protocol/auth-helpers';
import { LitActionResource } from '@lit-protocol/auth-helpers';
import { litNodeClient } from './lit';
import { LIT_ABILITY } from '@lit-protocol/constants';
import { validateSessionSigs } from '@lit-protocol/misc';

export const getValidSessionSigs = async () => {
  try {
    // Check if lit-wallet-sig exists in localStorage first
    const litWalletSig = localStorage.getItem('lit-wallet-sig');
    if (!litWalletSig) {
      return null;
    }

    // Generate session key
    const sessionKey = await litNodeClient.getSessionKey();
    // Generate session capability object with wildcards
    const sessionCapabilityObject =
      await litNodeClient.generateSessionCapabilityObjectWithWildcards([
        new LitActionResource('*'),
        new LitPKPResource('*'),
      ]);
    // Get wallet signature
    const walletSig = await litNodeClient.getWalletSig({
      chain: 'ethereum',
      expiration: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
      sessionKey,
      sessionKeyUri: `lit:session:${sessionKey.publicKey}`,
      sessionCapabilityObject,
      nonce: Date.now().toString(),
    });

    if (walletSig) {
      await litNodeClient.connect();
      const attemptedSessionSigs = await litNodeClient.getSessionSigs({
        capabilityAuthSigs: [walletSig],
        resourceAbilityRequests: [
          {
            resource: new LitActionResource('*'),
            ability: LIT_ABILITY.LitActionExecution,
          },
          {
            resource: new LitPKPResource('*'),
            ability: LIT_ABILITY.PKPSigning,
          },
        ],
        authNeededCallback: () => {
          return Promise.resolve(walletSig);
        },
      });

      const validationResult = await validateSessionSigs(attemptedSessionSigs);

      if (validationResult.isValid) {
        return attemptedSessionSigs;
      } else {
        return null;
      }
    }

    return null; // Explicit return when walletSig is falsy
  } catch (error) {
    console.error('Error validating session:', error);
    return null; // Explicit return in catch block
  }
};

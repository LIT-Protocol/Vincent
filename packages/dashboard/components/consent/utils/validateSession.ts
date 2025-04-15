import { LitPKPResource } from "@lit-protocol/auth-helpers";

import { LitActionResource } from "@lit-protocol/auth-helpers";
import { litNodeClient } from "./lit";
import { LIT_ABILITY } from "@lit-protocol/constants";
import { validateSessionSigs } from "@lit-protocol/misc";

const validateSession = async () => {
    try {
      // Check if lit-wallet-sig exists in localStorage first
      const litWalletSig = localStorage.getItem('lit-wallet-sig');
      if (!litWalletSig) {
        return;
      }

      // Create lit resources for action execution and PKP signing
      const litResources = [
        new LitActionResource('*'),
        new LitPKPResource('*'),
      ];

      // Generate session key
      const sessionKey = await litNodeClient.getSessionKey();
      // Generate session capability object with wildcards
      const sessionCapabilityObject =
        await litNodeClient.generateSessionCapabilityObjectWithWildcards(
          litResources
        );
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

        if(!attemptedSessionSigs) {
          return;
        }

        const validationResult = await validateSessionSigs(
          attemptedSessionSigs
        );

        if (validationResult.isValid) {
          return attemptedSessionSigs;
        } else {
          return null;
        }
      }
    } catch (error) {
    console.error('Error validating session:', error);
  }
};

export default validateSession;
import type { OwnerAttestation } from '../internal/signOwnerAttestation';

import { verifyAppOwnership } from '../internal/readVincentContract';
import { signOwnerAttestation } from '../internal/signOwnerAttestation';

export interface SignOwnerAttestationParams {
  srcChainId: number;
  srcContract: string;
  owner: string;
  appId: number;
  issuedAt: number;
  dstChainId: number;
  dstContract: string;
  pkpPublicKey: string;
}

export interface SignOwnerAttestationResult {
  signature: string;
  attestation: OwnerAttestation;
}

/**
 * Lit Action to verify app ownership and sign an owner attestation
 *
 * This action:
 * 1. Validates that the provided issuedAt timestamp is within ±30 seconds of current time
 * 2. Reads from the Vincent Diamond contract on Chronicle Yellowstone to verify ownership
 * 3. Creates an OwnerAttestation structure
 * 4. Signs it with the PKP
 * 5. Returns the signature
 *
 * The issuedAt parameter must be provided by the caller to ensure all nodes sign the same message.
 *
 * @param params - Parameters for signing the owner attestation
 * @returns The signature and attestation data
 */
export async function signOwnerAttestationAction({
  srcChainId,
  srcContract,
  owner,
  appId,
  issuedAt,
  dstChainId,
  dstContract,
  pkpPublicKey,
}: SignOwnerAttestationParams): Promise<SignOwnerAttestationResult> {
  console.log('Starting owner attestation signing process');
  console.log(`appId: ${appId}, owner: ${owner}, issuedAt: ${issuedAt}`);

  // Validate that issuedAt is within ±30 seconds of current time
  // This prevents replay attacks and ensures all nodes sign the same message
  const currentTime = Math.floor(Date.now() / 1000);
  const timeDiff = Math.abs(currentTime - issuedAt);
  const MAX_TIME_DRIFT_SECONDS = 30;

  if (timeDiff > MAX_TIME_DRIFT_SECONDS) {
    throw new Error(
      `issuedAt timestamp ${issuedAt} is outside acceptable range. ` +
        `Current time: ${currentTime}, difference: ${timeDiff}s, max allowed: ${MAX_TIME_DRIFT_SECONDS}s`,
    );
  }

  console.log(
    `Timestamp validated: issuedAt=${issuedAt}, currentTime=${currentTime}, diff=${timeDiff}s`,
  );

  // Verify that the owner actually owns the app on Chronicle Yellowstone
  const isOwner = await verifyAppOwnership(srcChainId, srcContract, appId, owner);

  if (!isOwner) {
    throw new Error(
      `Address ${owner} is not the owner of app ${appId} on the Vincent contract at ${srcContract}`,
    );
  }

  console.log('Ownership verified successfully');

  // Calculate expiration (5 minutes from issuedAt)
  const attestationValiditySeconds = 300; // 5 minutes
  const expiresAt = issuedAt + attestationValiditySeconds;

  // Create the attestation
  const attestation: OwnerAttestation = {
    srcChainId,
    srcContract,
    owner,
    appId,
    issuedAt,
    expiresAt,
    dstChainId,
    dstContract,
  };

  console.log('Created attestation:', JSON.stringify(attestation));

  // Sign the attestation
  const signature = await signOwnerAttestation(attestation, pkpPublicKey);

  console.log('Attestation signed successfully');

  return {
    signature,
    attestation,
  };
}

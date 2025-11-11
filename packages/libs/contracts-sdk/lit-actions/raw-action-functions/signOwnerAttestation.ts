import { verifyAppOwnership } from '../internal/readVincentContract';
import { signOwnerAttestation, OwnerAttestation } from '../internal/signOwnerAttestation';

export interface SignOwnerAttestationParams {
  srcChainId: number;
  srcContract: string;
  owner: string;
  appId: number;
  dstChainId: number;
  dstContract: string;
  pkpPublicKey: string;
  chronicleYellowstoneRpcUrl: string;
  attestationValiditySeconds?: number; // defaults to 300 (5 minutes)
}

export interface SignOwnerAttestationResult {
  signature: string;
  attestation: OwnerAttestation;
}

/**
 * Lit Action to verify app ownership and sign an owner attestation
 *
 * This action:
 * 1. Reads from the Vincent Diamond contract on Chronicle Yellowstone to verify ownership
 * 2. Creates an OwnerAttestation structure
 * 3. Signs it with the PKP
 * 4. Returns the signature
 *
 * @param params - Parameters for signing the owner attestation
 * @returns The signature and attestation data
 */
export async function signOwnerAttestationAction({
  srcChainId,
  srcContract,
  owner,
  appId,
  dstChainId,
  dstContract,
  pkpPublicKey,
  chronicleYellowstoneRpcUrl,
  attestationValiditySeconds = 300, // 5 minutes default
}: SignOwnerAttestationParams): Promise<SignOwnerAttestationResult> {
  console.log('Starting owner attestation signing process');
  console.log(`appId: ${appId}, owner: ${owner}`);

  // Verify that the owner actually owns the app on Chronicle Yellowstone
  const isOwner = await verifyAppOwnership(srcContract, appId, owner, chronicleYellowstoneRpcUrl);

  if (!isOwner) {
    throw new Error(
      `Address ${owner} is not the owner of app ${appId} on the Vincent contract at ${srcContract}`,
    );
  }

  console.log('Ownership verified successfully');

  // Get current time in seconds (Unix timestamp)
  const issuedAt = Math.floor(Date.now() / 1000);
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

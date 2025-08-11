import { PKPEthersWallet } from '@lit-protocol/pkp-ethers';
import { LIT_RPC } from '@lit-protocol/constants';
import { litNodeClient } from '@/utils/user-dashboard/lit';
import { SessionSigs } from '@lit-protocol/types';
import { AuthInfo } from '@/hooks/user-dashboard/useAuthInfo';

type initPkpSignerProps = {
  authInfo: AuthInfo | null;
  sessionSigs: SessionSigs | null;
  appId?: number; // Optional: if provided, uses agent PKP for this app; otherwise uses user PKP
};

export const initPkpSigner = async ({ authInfo, sessionSigs, appId }: initPkpSignerProps) => {
  if (!authInfo || !sessionSigs || !authInfo.userPKP) {
    throw new Error('No auth info or session sigs found');
  }

  // Determine which PKP to use
  let pkpToUse;
  if (appId && authInfo.agentPKPs?.[appId]) {
    // Use agent PKP for the specified app
    pkpToUse = authInfo.agentPKPs[appId];
  } else {
    // Fall back to user PKP
    pkpToUse = authInfo.userPKP;
  }

  try {
    const pkpWallet = new PKPEthersWallet({
      controllerSessionSigs: sessionSigs,
      pkpPubKey: pkpToUse.publicKey,
      litNodeClient: litNodeClient,
      rpc: LIT_RPC.CHRONICLE_YELLOWSTONE,
    });

    await pkpWallet.init();

    return pkpWallet;
  } catch (error) {
    console.error('Error initializing PKP signer:', error);
    throw new Error('Failed to initialize PKP signer');
  }
};

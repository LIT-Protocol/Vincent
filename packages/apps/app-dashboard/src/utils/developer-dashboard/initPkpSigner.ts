import { PKPEthersWallet } from '@lit-protocol/pkp-ethers';
import { LIT_RPC } from '@lit-protocol/constants';
import { litNodeClient } from '@/utils/user-dashboard/lit';
import { SessionSigs } from '@lit-protocol/types';
import { AuthInfo } from '@/hooks/user-dashboard/useAuthInfo';

type initPkpSignerProps = {
  authInfo: AuthInfo | null;
  sessionSigs: SessionSigs | null;
};

export const initPkpSigner = async ({ authInfo, sessionSigs }: initPkpSignerProps) => {
  if (!authInfo || !sessionSigs || !authInfo.userPKP) {
    throw new Error('No auth info or session sigs found');
  }

  try {
    const pkpWallet = new PKPEthersWallet({
      controllerSessionSigs: sessionSigs,
      pkpPubKey: authInfo.userPKP.publicKey,
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

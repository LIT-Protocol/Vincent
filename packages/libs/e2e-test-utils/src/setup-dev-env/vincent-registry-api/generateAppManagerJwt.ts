import { PKPEthersWallet } from '@lit-protocol/pkp-ethers';
import { createPlatformUserJWT } from '@lit-protocol/vincent-app-sdk/jwt';
import { Wallet } from 'ethers';

export async function generateAppManagerJwt({
  appManagerPrivateKey,
}: {
  appManagerPrivateKey: `0x${string}`;
}): Promise<string> {
  const wallet = new Wallet(appManagerPrivateKey);
  const address = await wallet.getAddress();

  const jwt = await createPlatformUserJWT({
    pkpWallet: wallet as unknown as PKPEthersWallet,
    pkpInfo: {
      tokenId: '0', // Not used for app manager auth
      publicKey: wallet.publicKey,
      ethAddress: address,
    },
    payload: {
      name: 'Vincent App Manager',
    },
    expiresInMinutes: 2,
    audience: 'registry.heyvincent.ai',
    authentication: {
      type: 'wallet',
      value: address,
    },
  });

  return jwt;
}

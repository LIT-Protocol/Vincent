import { env } from '@/config/env';

const { VITE_LIT_PAYER_SECRET_KEY } = env;

export async function addPayee(ethAddress: string) {
  try {
    const headers = {
      'api-key': 'test-api-key',
      'payer-secret-key': VITE_LIT_PAYER_SECRET_KEY,
      'Content-Type': 'application/json',
    };

    const response = await fetch('https://datil-relayer.getlit.dev/add-users', {
      method: 'POST',
      headers,
      body: JSON.stringify([ethAddress]),
    });

    interface AddUserResponse {
      success: boolean;
      error?: string;
    }

    if (!response.ok) {
      throw new Error(`Error: ${await response.text()}`);
    }

    const data = (await response.json()) as AddUserResponse;
    if (data.success !== true) {
      throw new Error(`Error: ${data.error}`);
    }
  } catch (err) {
    console.warn('Failed to add payee', err);
  }
  console.log('Payee added: ', ethAddress);
}

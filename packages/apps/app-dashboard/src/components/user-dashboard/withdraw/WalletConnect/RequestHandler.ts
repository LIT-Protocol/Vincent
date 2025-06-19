import { IWalletKit } from '@reown/walletkit';

// Store for pending session requests
let pendingSessionRequests: any[] = [];

/**
 * Get the current pending session requests
 * @returns Array of pending session requests
 */
export function getPendingSessionRequests(): any[] {
  return [...pendingSessionRequests];
}

/**
 * Clear a session request from the pending requests list
 * @param id The ID of the request to clear
 */
export function clearSessionRequest(id: number): void {
  pendingSessionRequests = pendingSessionRequests.filter((req) => req.id !== id);
}

/**
 * Setup request handlers for the WalletKit client
 * This allows the client to handle requests from dApps
 * @param client The WalletKit client
 */
export function setupRequestHandlers(client: IWalletKit): void {
  // Log session events for debugging
  client.on('session_request', (event: any) => {
    // Check if request already exists to prevent duplicates
    const existingRequest = pendingSessionRequests.find((req) => req.id === event.id);
    if (!existingRequest) {
      pendingSessionRequests.push(event);

      const customEvent = new CustomEvent('walletconnect:session_request', {
        detail: event,
      });
      window.dispatchEvent(customEvent);
    } else {
      console.log('Request already exists, skipping duplicate:', event.id);
    }
  });

  client.on('session_proposal', (event: any) => {
    console.log('Received session proposal:', event);
  });

  client.on('session_delete', (event: any) => {
    console.log('Session deleted:', event);
  });

  window.addEventListener('walletconnect:transaction_complete', (event: Event) => {
    const customEvent = event as CustomEvent;
    console.log('Transaction complete event received:', customEvent.detail);

    notifyTransactionComplete(client, customEvent.detail);
  });

  window.addEventListener('walletconnect:transaction_error', (event: Event) => {
    const customEvent = event as CustomEvent;
    console.log('Transaction error event received:', customEvent.detail);

    notifyTransactionError(client, customEvent.detail);
  });

  console.log('WalletKit request handlers setup completed');
}

/**
 * Notify the dapp that a transaction has completed successfully
 */
function notifyTransactionComplete(client: IWalletKit, detail: any): void {
  const { topic, id, result } = detail;

  if (!topic || id === undefined) {
    console.error('Cannot notify transaction complete: missing topic or id');
    return;
  }

  console.log(`Notifying dapp of completed transaction: ${id} on topic ${topic}`);

  // Send the response to the dapp
  client
    .respondSessionRequest({
      topic,
      response: {
        id,
        jsonrpc: '2.0',
        result,
      },
    })
    .then(() => {
      console.log(`Successfully responded to request ${id}`);
    })
    .catch((error) => {
      console.error(`Error responding to request ${id}:`, error);
    });
}

/**
 * Notify the dapp that a transaction has failed
 */
function notifyTransactionError(client: IWalletKit, detail: any): void {
  const { topic, id, error } = detail;

  if (!topic || id === undefined) {
    console.error('Cannot notify transaction error: missing topic or id');
    return;
  }

  console.log(`Notifying dapp of transaction error: ${id} on topic ${topic}`);

  // Send the error response to the dapp
  client
    .respondSessionRequest({
      topic,
      response: {
        id,
        jsonrpc: '2.0',
        error: {
          code: 4001,
          message: error || 'Transaction failed',
        },
      },
    })
    .then(() => {
      console.log(`Successfully responded with error to request ${id}`);
    })
    .catch((errorResp) => {
      console.error(`Error responding with error to request ${id}:`, errorResp);
    });
}

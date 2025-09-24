import type { LIT_NETWORK_VALUES } from '@lit-protocol/constants';

import type { BaseRequestParams, SupportedNetworks } from './types';

import { JWT_AUTHORIZATION_SCHEMA_PREFIX, SERVICE_URL_BY_LIT_NETWORK } from './constants';

/**
 * Creates an Authorization header value for JWT token authentication.
 *
 * @param {string} jwtToken - The JWT token from Vincent delegatee authentication
 * @returns {string} Complete Authorization header value with Bearer prefix
 *
 * @internal
 */
function composeAuthHeader(jwtToken: string) {
  return `${JWT_AUTHORIZATION_SCHEMA_PREFIX}${jwtToken}`;
}

/**
 * Array of supported Lit networks for Vincent wrapped keys operations.
 * Vincent only supports production 'datil' network.
 *
 * @constant {SupportedNetworks[]}
 * @internal
 */
const supportedNetworks: SupportedNetworks[] = ['datil'];

/**
 * TypeScript assertion function that validates a Lit network is supported by Vincent.
 * Throws an error if the network is not in the supported networks list.
 *
 * @param {LIT_NETWORK_VALUES} litNetwork - The Lit network to validate
 * @throws {Error} If the network is not supported by Vincent
 *
 * @internal
 */
function isSupportedLitNetwork(
  litNetwork: LIT_NETWORK_VALUES,
): asserts litNetwork is SupportedNetworks {
  // @ts-expect-error - This is an assert function; litNetwork by definition may be an invalid value
  if (!supportedNetworks.includes(litNetwork)) {
    throw new Error(`Unsupported LIT_NETWORK! Only ${supportedNetworks.join('|')} are supported.`);
  }
}

/**
 * Gets the service URL for the specified Lit network.
 *
 * @param {BaseRequestParams} params - Request parameters containing the Lit network
 * @returns {string} The Vincent wrapped keys service URL for the network
 * @throws {Error} If the network is not supported
 *
 * @internal
 */
function getServiceUrl({ litNetwork }: BaseRequestParams) {
  isSupportedLitNetwork(litNetwork);

  return SERVICE_URL_BY_LIT_NETWORK[litNetwork];
}

/**
 * Constructs base request parameters for Vincent wrapped keys service HTTP requests.
 *
 * This function prepares the URL and headers needed for authenticated requests to the
 * Vincent wrapped keys service, including JWT authorization and correlation ID for tracking.
 *
 * @param {BaseRequestParams} requestParams - Base parameters for the request
 * @returns {Object} Object containing the base URL and initialized request parameters
 * @returns {string} returns.baseUrl - The complete service URL for the Lit network
 * @returns {RequestInit} returns.initParams - Fetch-compatible request initialization parameters
 *
 * @throws {Error} If the Lit network is not supported by Vincent
 *
 * @example
 * ```typescript
 * const { baseUrl, initParams } = getBaseRequestParams({
 *   jwtToken: 'eyJhbGciOiJIUzI1NiIs...',
 *   method: 'GET',
 *   litNetwork: 'datil',
 *   requestId: 'abc123'
 * });
 * ```
 */
export function getBaseRequestParams(requestParams: BaseRequestParams): {
  initParams: RequestInit;
  baseUrl: string;
} {
  const { jwtToken, method, litNetwork } = requestParams;

  // NOTE: Although HTTP conventions use capitalized letters for header names
  // Lambda backend events from API gateway receive all lowercased header keys
  return {
    baseUrl: getServiceUrl(requestParams),
    initParams: {
      method,
      headers: {
        'x-correlation-id': requestParams.requestId,
        'Content-Type': 'application/json',
        'lit-network': litNetwork,
        authorization: composeAuthHeader(jwtToken),
      },
    },
  };
}

/**
 * Extracts error message from HTTP response, handling both JSON and plain text formats.
 *
 * Under normal operations, the Vincent wrapped keys service returns errors in JSON format
 * with a `message` field. However, infrastructure errors may return plain text responses.
 * This function gracefully handles both cases.
 *
 * @param {Response} response - The HTTP response from fetch()
 * @returns {Promise<string>} The error message extracted from the response
 *
 * @internal
 */
async function getResponseErrorMessage(response: Response): Promise<string> {
  try {
    const parsedResponse = (await response.json()) as { message?: string };
    if (parsedResponse.message) {
      return parsedResponse.message as string;
    }
    return JSON.stringify(parsedResponse);
  } catch {
    return response.text();
  }
}

/**
 * Attempts to parse HTTP response as JSON, falling back to text if parsing fails.
 *
 * Vincent wrapped keys service responses should always be in JSON format.
 * However, some misbehaving infrastructure could return a 200 OK response with
 * plain text body. This function handles both cases gracefully.
 *
 * @template T - The expected type of the JSON response
 * @param {Response} response - The HTTP response from fetch()
 * @returns {Promise<T | string>} Parsed JSON response or plain text string
 *
 * @internal
 */
async function getResponseJson<T>(response: Response): Promise<T | string> {
  try {
    return (await response.json()) as Promise<T>; // NOTE: `await` here is necessary for errors to be caught by try{}
  } catch {
    return await response.text();
  }
}

/**
 * Generates a random request ID for tracking Vincent wrapped keys service requests.
 *
 * The request ID is used for correlation between client and server logs,
 * making it easier to debug issues with specific requests.
 *
 * @returns {string} A random hexadecimal string to use as request ID
 *
 * @example
 * ```typescript
 * const requestId = generateRequestId(); // e.g., "a3f2d8b9c1e4"
 * ```
 */
export function generateRequestId(): string {
  return Math.random().toString(16).slice(2);
}

/**
 * Makes an authenticated HTTP request to the Vincent wrapped keys service.
 *
 * This function handles the complete request lifecycle including error handling,
 * response parsing, and Vincent-specific error formatting. All errors are wrapped
 * with request ID for tracking.
 *
 * @template T - The expected type of the successful response
 * @param {Object} params - Request parameters
 * @param {string} params.url - The complete URL to make the request to
 * @param {RequestInit} params.init - Fetch-compatible request initialization
 * @param {string} params.requestId - Unique request ID for tracking
 * @returns {Promise<T>} The parsed response data
 *
 * @throws {Error} If the request fails, with Vincent-specific error formatting
 *
 * @example
 * ```typescript
 * const result = await makeRequest<StoredKeyData>({
 *   url: 'https://wrapped.litprotocol.com/delegatee/encrypted/0x123/abc-def',
 *   init: { method: 'GET', headers: { ... } },
 *   requestId: 'req123'
 * });
 * ```
 */
export async function makeRequest<T>({
  url,
  init,
  requestId,
}: {
  url: string;
  init: RequestInit;
  requestId: string;
}) {
  try {
    const response = await fetch(url, { ...init });

    if (!response.ok) {
      const errorMessage = await getResponseErrorMessage(response);
      throw new Error(`HTTP(${response.status}): ${errorMessage}`);
    }

    const result = await getResponseJson<T>(response);

    if (typeof result === 'string') {
      throw new Error(`HTTP(${response.status}): ${result}`);
    }

    return result;
  } catch (e: unknown) {
    throw new Error(
      `Request(${requestId}) for Vincent wrapped key failed. Error: ${
        (e as Error).message
        // @ts-expect-error Unknown, but `cause` is on `TypeError: fetch failed` errors
      }${e.cause ? ' - ' + e.cause : ''}`,
    );
  }
}

import { verify } from '../../jwt/core/validate';
import { JWT_URL_KEY, PRODUCTION_VINCENT_DASHBOARD_URL } from '../constants';

export const decodeVincentJWTFromUri = ({
  uri,
  expectedAudience,
  requiredAppId,
}: {
  uri: string;
  expectedAudience: string;
  requiredAppId: number;
}) => {
  const url = new URL(uri);
  const jwt = url.searchParams.get(JWT_URL_KEY);

  if (!jwt) {
    return null;
  }

  try {
    return { decodedJWT: verify({ jwt, expectedAudience, requiredAppId }), jwtStr: jwt };
  } catch (error) {
    // Explicitly throw if the JWT doesn't contain the required appId
    throw new Error(`Failed to decode JWT: ${(error as Error).message}`);
  }
};

export const isLoginUri = (uri: string) => {
  const url = new URL(uri);
  const loginJwt = url.searchParams.get(JWT_URL_KEY);

  return !!loginJwt;
};

export function composeDelegationAuthUrl(
  appId: number,
  redirectUri: string,
  delegationAuthPageUrl?: string
) {
  return new URL(
    `/appId/${String(appId)}/consent?redirectUri=${redirectUri}`,
    delegationAuthPageUrl || PRODUCTION_VINCENT_DASHBOARD_URL
  );
}

export const removeSearchParam = ({
  paramName,
  uri,
}: {
  paramName: string;
  uri: string;
}): string => {
  const url = new URL(uri);
  url.searchParams.delete(paramName);
  // Update the browser's history without reloading the page
  return url.toString();
};

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

export const uriContainsVincentJWT = (uri: string) => {
  const url = new URL(uri);
  const connectJwt = url.searchParams.get(JWT_URL_KEY);

  return !!connectJwt;
};

export function composeConnectUrl(appId: number, redirectUri: string, connectPageUrl?: string) {
  return new URL(
    `/user/appId/${String(appId)}/connect?redirectUri=${redirectUri}`,
    connectPageUrl || PRODUCTION_VINCENT_DASHBOARD_URL
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

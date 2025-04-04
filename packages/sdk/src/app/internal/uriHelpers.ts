import { JWT_URL_KEY, PRODUCTION_VINCENT_DASHBOARD_URL } from '../constants';
import { decodeJWT } from '../../jwt/core/validate';

export const decodeVincentJWTFromUri = (uri: string) => {
  const url = new URL(uri);
  const jwt = url.searchParams.get(JWT_URL_KEY);

  if (!jwt) {
    return null;
  }

  return { decodedJWT: decodeJWT(jwt), jwtStr: jwt };
};

export const isLoginUri = (uri: string) => {
  const url = new URL(uri);
  const loginJwt = url.searchParams.get(JWT_URL_KEY);

  return !!loginJwt;
};

export function composeConsentUrl(appId: string, redirectUri: string, consentPageUrl?: string) {
  return new URL(
    `/appId/${appId}/consent?redirectUri=${redirectUri}`,
    consentPageUrl || PRODUCTION_VINCENT_DASHBOARD_URL
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

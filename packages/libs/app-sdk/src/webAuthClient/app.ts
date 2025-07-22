import type {
  RedirectToVincentDelegationPageParams,
  WebAuthClientConfig,
  WebAuthClient,
} from './types';

import { JWT_URL_KEY } from './constants';
import { uriHelpers } from './internal';

const { isLoginUri, composeDelegationAuthUrl, removeSearchParam, decodeVincentJWTFromUri } =
  uriHelpers;

const redirectToDelegationAuthPage = ({
  appId,
  redirectUri,
  delegationAuthPageUrl,
}: {
  appId: string;
  redirectUri: string;
  delegationAuthPageUrl?: string;
}) =>
  window.open(
    composeDelegationAuthUrl(appId, redirectUri, delegationAuthPageUrl).toString(),
    '_self'
  );

/** Create a new {@link WebAuthClient} instance.
 *
 * - `appId` is the numeric app ID displayed for your app on the Vincent Dashboard
 * */
export const getWebAuthClient = (appClientConfig: WebAuthClientConfig): WebAuthClient => {
  const { appId } = appClientConfig;

  return {
    redirectToDelegationAuthPage: (
      redirectDelegationAuthPageConfig: RedirectToVincentDelegationPageParams
    ) => {
      const { delegationAuthPageUrl, redirectUri } = redirectDelegationAuthPageConfig;
      redirectToDelegationAuthPage({
        appId,
        delegationAuthPageUrl,
        redirectUri,
      });
    },
    isLogin: () => isLoginUri(window.location.href),
    decodeVincentLoginJWT: (expectedAudience: string) =>
      decodeVincentJWTFromUri(window.location.href, expectedAudience),
    removeLoginJWTFromURI: () => {
      const urlWithoutJWTSearchParam = removeSearchParam({
        paramName: JWT_URL_KEY,
        uri: window.location.href,
      });
      window.history.replaceState({}, document.title, urlWithoutJWTSearchParam);
    },
  };
};

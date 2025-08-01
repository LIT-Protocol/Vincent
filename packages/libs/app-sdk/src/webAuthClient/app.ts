import type {
  RedirectToVincentDelegationPageParams,
  WebAuthClientConfig,
  WebAuthClient,
} from './types';

import { JWT_URL_KEY } from './constants';
import { uriHelpers } from './internal';

const { uriContainsVincentJWT, composeConnectUrl, removeSearchParam, decodeVincentJWTFromUri } =
  uriHelpers;

const redirectToConnectPage = ({
  appId,
  redirectUri,
  connectPageUrl,
}: {
  appId: number;
  redirectUri: string;
  connectPageUrl?: string;
}) => window.open(composeConnectUrl(appId, redirectUri, connectPageUrl).toString(), '_self');

/** Create a new {@link WebAuthClient} instance.
 *
 * - `appId` is the numeric app ID displayed for your app on the Vincent Dashboard
 * */
export const getWebAuthClient = (appClientConfig: WebAuthClientConfig): WebAuthClient => {
  const { appId } = appClientConfig;

  return {
    redirectToConnectPage: (redirectConnectPageConfig: RedirectToVincentDelegationPageParams) => {
      const { connectPageUrl, redirectUri } = redirectConnectPageConfig;
      redirectToConnectPage({
        appId,
        connectPageUrl,
        redirectUri,
      });
    },
    uriContainsVincentJWT: () => uriContainsVincentJWT(window.location.href),
    decodeVincentJWTFromUri: (expectedAudience: string) =>
      decodeVincentJWTFromUri({
        uri: window.location.href,
        expectedAudience: expectedAudience,
        requiredAppId: appId,
      }),
    removeVincentJWTFromURI: () => {
      const urlWithoutJWTSearchParam = removeSearchParam({
        paramName: JWT_URL_KEY,
        uri: window.location.href,
      });
      window.history.replaceState({}, document.title, urlWithoutJWTSearchParam);
    },
  };
};

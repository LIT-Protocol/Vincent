import type {
  RedirectToVincentConsentPageParams,
  VincentAppClientConfig,
  VincentWebAppClient,
} from './types';

import { JWT_URL_KEY } from './constants';
import { uriHelpers } from './internal';

const { isLoginUri, composeConsentUrl, removeSearchParam, decodeVincentJWTFromUri } = uriHelpers;

const redirectToConsentPage = ({
  appId,
  redirectUri,
  consentPageUrl,
}: {
  appId: string;
  redirectUri: string;
  consentPageUrl?: string;
}) => window.open(composeConsentUrl(appId, redirectUri, consentPageUrl).toString(), '_self');

/** Create a new {@link VincentWebAppClient} instance.
 *
 * - `appId` is the numeric app ID displayed for your app on the Vincent Dashboard
 *
 * @category API Methods
 * */
export const getVincentWebAppClient = (
  appClientConfig: VincentAppClientConfig
): VincentWebAppClient => {
  const { appId } = appClientConfig;

  return {
    redirectToConsentPage: (redirectConsentPageConfig: RedirectToVincentConsentPageParams) => {
      const { consentPageUrl, redirectUri } = redirectConsentPageConfig;
      redirectToConsentPage({ appId, consentPageUrl, redirectUri });
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

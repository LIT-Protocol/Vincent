import {
  RedirectToVincentConsentPageParams,
  VincentAppClientConfig,
  VincentWebAppClient,
} from './types';
import { uriHelpers } from './internal';
import { composeConsentUrl } from './internal/uriHelpers';

const { isLoginUri, decodeVincentJWTFromUri } = uriHelpers;

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
 * @category Vincent SDK API
 * */
export const getVincentWebAppClient = (
  appClientConfig: VincentAppClientConfig
): VincentWebAppClient => {
  const { appId } = appClientConfig;

  return {
    redirectToConsentPage: (redirectConsentPageConfig: RedirectToVincentConsentPageParams) => {
      const { redirectUri } = redirectConsentPageConfig;
      redirectToConsentPage({ appId, redirectUri });
    },
    isLogin: () => isLoginUri(window.location.href),
    decodeVincentLoginJWT: () => decodeVincentJWTFromUri(window.location.href),
  };
};

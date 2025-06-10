import { getVincentContract } from '../../utils/get-vincent-contract';

export const getVincentApp = async ({
  vincentAddress,
  vincentAppId,
  vincentAppVersion,
}: {
  vincentAddress: string;
  vincentAppId: number;
  vincentAppVersion: number;
}) => {
  const vincentContract = await getVincentContract({ vincentAddress });

  const { app, appVersion } = await vincentContract.getAppVersion(vincentAppId, vincentAppVersion);

  return {
    app,
    appVersion,
  };
};

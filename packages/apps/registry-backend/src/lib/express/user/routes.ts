import type { Express } from 'express';

import { completeInstallation } from '../../completeInstallation';
import { getAgentAccount } from '../../getAgentAccount';
import { installApp } from '../../installApp';
import { requireApp, withApp } from '../app/requireApp';

export function registerRoutes(app: Express) {
  app.post(
    '/user/:appId/install-app',
    requireApp(),
    withApp(async (req, res) => {
      const result = await installApp({
        appId: req.vincentApp.appId,
        userControllerAddress: req.body.userControllerAddress,
      });

      res.json(result);
      return;
    }),
  );

  app.post(
    '/user/:appId/complete-installation',
    requireApp(),
    withApp(async (req, res) => {
      const result = await completeInstallation({
        typedDataSignature: req.body.typedDataSignature,
        appInstallationDataToSign: req.body.appInstallationDataToSign,
      });

      res.json(result);
      return;
    }),
  );

  app.post(
    '/user/:appId/agent-account',
    requireApp(),
    withApp(async (req, res) => {
      const result = await getAgentAccount({
        appId: req.vincentApp.appId,
        userControllerAddress: req.body.userControllerAddress,
      });

      res.json({ agentAddress: result });
      return;
    }),
  );
}

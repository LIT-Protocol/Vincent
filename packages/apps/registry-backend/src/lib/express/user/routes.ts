import type { Express } from 'express';

import { completeInstallation } from '../../completeInstallation';
import { completeRelayTransaction } from '../../completeRelayTransaction';
import { getAgentAccount } from '../../getAgentAccount';
import { getAgentFunds } from '../../getAgentFunds';
import { installApp } from '../../installApp';
import { unpermitApp } from '../../unpermitApp';
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

  app.post(
    '/user/:appId/unpermit-app',
    requireApp(),
    withApp(async (req, res) => {
      const result = await unpermitApp({
        appId: req.vincentApp.appId,
        appVersion: req.body.appVersion,
        userControllerAddress: req.body.userControllerAddress,
      });

      res.json(result);
      return;
    }),
  );

  app.post(
    '/user/:appId/complete-unpermit',
    requireApp(),
    withApp(async (req, res) => {
      const result = await completeRelayTransaction({
        typedDataSignature: req.body.typedDataSignature,
        dataToSign: req.body.unpermitDataToSign,
        operationName: 'completeUnpermit',
      });

      res.json(result);
      return;
    }),
  );

  app.post(
    '/user/:appId/agent-funds',
    requireApp(),
    withApp(async (req, res) => {
      const result = await getAgentFunds({
        appId: req.vincentApp.appId,
        userControllerAddress: req.body.userControllerAddress,
        networks: req.body.networks,
      });

      res.json(result);
      return;
    }),
  );
}

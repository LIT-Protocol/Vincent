import type { Express } from 'express';

import { completeInstallation } from '../../completeInstallation';
import { completeRelayTransaction } from '../../completeRelayTransaction';
import { completeWithdraw } from '../../completeWithdraw';
import { getAgentAccount } from '../../getAgentAccount';
import { getAgentFunds } from '../../getAgentFunds';
import { installApp } from '../../installApp';
import { requestWithdraw } from '../../requestWithdraw';
import { uninstallApp } from '../../uninstallApp';
import { requireApp, withApp } from '../app/requireApp';

export function registerRoutes(app: Express) {
  app.post(
    '/user/:appId/install-app',
    requireApp(),
    withApp(async (req, res) => {
      const result = await installApp({
        appId: req.vincentApp.appId,
        userControllerAddress: req.body.userControllerAddress,
        sponsorGas: req.body.sponsorGas,
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
        userControllerAddress: req.body.userControllerAddress,
        appId: req.vincentApp.appId,
        agentSignerAddress: req.body.agentSignerAddress,
        appInstallation: req.body.appInstallation,
        agentSmartAccountDeployment: req.body.agentSmartAccountDeployment,
        sessionKeyApproval: req.body.sessionKeyApproval,
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
    '/user/:appId/uninstall-app',
    requireApp(),
    withApp(async (req, res) => {
      const result = await uninstallApp({
        appId: req.vincentApp.appId,
        appVersion: req.body.appVersion,
        userControllerAddress: req.body.userControllerAddress,
        sponsorGas: req.body.sponsorGas,
      });

      res.json(result);
      return;
    }),
  );

  app.post(
    '/user/:appId/complete-uninstall',
    requireApp(),
    withApp(async (req, res) => {
      const result = await completeRelayTransaction({
        typedDataSignature: req.body.typedDataSignature,
        dataToSign: req.body.uninstallDataToSign,
        operationName: 'completeUninstall',
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

  app.post(
    '/user/:appId/request-withdraw',
    requireApp(),
    withApp(async (req, res) => {
      const result = await requestWithdraw({
        appId: req.vincentApp.appId,
        userControllerAddress: req.body.userControllerAddress,
        assets: req.body.assets,
      });

      res.json(result);
      return;
    }),
  );

  app.post(
    '/user/:appId/complete-withdraw',
    requireApp(),
    withApp(async (req, res) => {
      const result = await completeWithdraw({
        withdrawals: req.body.withdrawals,
      });

      res.json(result);
      return;
    }),
  );
}

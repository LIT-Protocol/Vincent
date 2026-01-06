import type { Express } from 'express';

import { installApp } from '../../installApp';
import { requireApp, withApp } from '../app/requireApp';

export function registerRoutes(app: Express) {
  app.post(
    '/user/:appId/install-app',
    requireApp(),
    withApp(async (req, res) => {
      const { userControllerAddress } = req.body;

      const result = await installApp({
        appId: req.vincentApp.appId,
        userControllerAddress,
      });

      res.json(result);
      return;
    }),
  );
}

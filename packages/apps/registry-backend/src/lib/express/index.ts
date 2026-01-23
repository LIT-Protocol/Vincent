import type { Express } from 'express';

import path from 'node:path';

import cors from 'cors';
import { json } from 'express';
import * as OpenApiValidator from 'express-openapi-validator';

import { openApiJson } from '@lit-protocol/vincent-registry-sdk';

import { html } from '../../assets/apiHtml.json';
import { env } from '../../env';
import { registerRoutes as registerAbilityRoutes } from './ability/routes';
import { registerRoutes as registerAppRoutes } from './app/routes';
import { registerRoutes as registerPolicyRoutes } from './policy/routes';
import { registerRoutes as registerUserRoutes } from './user/routes';

const { IS_DEVELOPMENT, CORS_ALLOWED_DOMAIN } = env;

const corsConfig = {
  optionsSuccessStatus: 204,
  origin: IS_DEVELOPMENT ? true : [CORS_ALLOWED_DOMAIN],
};

export function registerRoutes(app: Express) {
  app.use(cors(corsConfig));
  app.use(json({ limit: '256kb' }));

  app.get('/openApiJson', (req, res) => {
    res.json(openApiJson);
  });

  console.log('Serving from', path.join(import.meta.dirname, './static'));
  app.get('/openapi', (req, res) => {
    res.send(html);
  });

  app.use(
    OpenApiValidator.middleware({
      // @ts-expect-error JSON 'generic' doesn't match the `DocumentV3` type - it's not exported from `express-openapi-validator`
      apiSpec: openApiJson,
      validateRequests: true, // (default)
      // validateResponses: true, // false by default
      validateSecurity: {
        handlers: {
          // Basic format check - full SIWE verification done by requireVincentAuth middleware
          siweAuth: async (req) => {
            const authHeader = req.headers.authorization;
            if (!authHeader?.startsWith('SIWE ')) {
              throw { status: 401, message: 'SIWE authorization required' };
            }
            return true;
          },
        },
      },
    }),
  );

  registerAppRoutes(app);
  registerAbilityRoutes(app);
  registerPolicyRoutes(app);
  registerUserRoutes(app);

  // @ts-expect-error Error handler is abstract/generic
  app.use((err, _req, res, _next) => {
    // format error
    res.status(err.status || 500).json({
      message: err.message,
      errors: err.errors,
    });
  });

  return app;
}

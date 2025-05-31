import cors from 'cors';
import express, { type Express } from 'express';
import * as OpenApiValidator from 'express-openapi-validator';
import helmet from 'helmet';

import { openApiJson } from '@lit-protocol/vincent-rest-api';

import { env } from '../../env';
import { toolRouter } from './tool.routes';
import { policyRouter } from './policy.routes';
import { appRouter } from './app.routes';

const { IS_DEVELOPMENT, CORS_ALLOWED_DOMAIN } = env;

const corsConfig = {
  optionsSuccessStatus: 204,
  origin: IS_DEVELOPMENT ? true : [CORS_ALLOWED_DOMAIN],
};

export function registerRoutes(app: Express) {
  app.use(cors(corsConfig));
  app.use(helmet());
  app.use(express.json());

  app.use(cors());
  app.use(helmet());
  app.use(express.json());

  app.use(
    OpenApiValidator.middleware({
      apiSpec: openApiJson as never,
      validateRequests: true, // (default)
      validateResponses: true, // false by default
    }),
  );

  // @ts-expect-error Error handler is abstract/generic
  app.use((err, req, res, next) => {
    // format error
    res.status(err.status || 500).json({
      message: err.message,
      errors: err.errors,
    });
  });

  app.use('/api/v1/tool', toolRouter);
  app.use('/api/v1/policy', policyRouter);
  app.use('/api/v1/app', appRouter);
}

import express from 'express';
import * as OpenApiValidator from 'express-openapi-validator';
import * as path from 'node:path';
import cors from 'cors';
import helmet from 'helmet';

const host = process.env.HOST ?? 'localhost';
const port = process.env.PORT ? Number(process.env.PORT) : 3000;

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());

app.use(
  OpenApiValidator.middleware({
    apiSpec: path.resolve(__dirname, './assets/openapi.json'),
    validateRequests: true, // (default)
    validateResponses: true, // false by default
  }),
);

app.get('/api/v1/app/:appId/version/:version', (req, res) => {
  const { appId, version } = req.params;

  console.log(`[ request ] GET /app/${appId}/version/${version}`);
  res.send({ message: `Hello ${appId} ${version}` });
});

app.get('/', (req, res) => {
  res.send({ message: 'Hello API' });
});

// @ts-expect-error Error handler is abstract/generic
app.use((err, req, res, next) => {
  // format error
  res.status(err.status || 500).json({
    message: err.message,
    errors: err.errors,
  });
});

app.listen(port, host, () => {
  console.log(`[ ready ] http://${host}:${port}`);
});

import express from 'express';
import * as OpenApiValidator from 'express-openapi-validator';
import * as path from 'node:path';
import cors from 'cors';
import helmet from 'helmet';
import { toolRouter } from './routes/tool.routes';
import { policyRouter } from './routes/policy.routes';
import { appRouter } from './routes/app.routes';
import mongoose from 'mongoose';

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
app.use('/api/v1/tool', toolRouter);
app.use('/api/v1/policy', policyRouter);
app.use('/api/v1/app', appRouter);

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/registry';

// Connect to MongoDB and start server
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(port, host, () => {
      console.log(`[ ready ] http://${host}:${port}`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
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

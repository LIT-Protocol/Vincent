import { model, Schema } from 'mongoose';

const AppToolSchema = new Schema({
  appId: { type: Number, required: true },
  appVersionNumber: { type: Number, required: true },
  toolPackageName: { type: String, required: true },
  toolVersion: { type: String, required: true },
  hiddenSupportedPolicies: [{ type: String }],
} as const);

// Compound index to ensure unique tool references per app version
AppToolSchema.index(
  { appVersionIdentity: 1, toolIdentity: 1, toolPackageName: 1, toolVersion: 1 },
  { unique: true },
);

export const AppTool = model('AppTool', AppToolSchema);

import { model, Schema } from 'mongoose';

const AppSchema = new Schema(
  {
    appId: { type: Number, required: true, unique: true },
    activeVersion: { type: Number, required: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    contactEmail: { type: String, required: true },
    appUserUrl: { type: String, required: true },
    logo: { type: String },
    redirectUrls: [{ type: String }],
    deploymentStatus: {
      type: String,
      required: true,
      enum: ['dev', 'prod', 'test'],
    },
    managerAddress: { type: String, required: true },
  } as const,
  { timestamps: true },
).index({ appId: 1 }, { unique: true }); // Only 1 doc per appId!

export const App = model('App', AppSchema);

export const AppVersionSchema = new Schema({
  appId: { type: Number, required: true },
  version: { type: Number, required: true },
  id: { type: Number, required: true, unique: true },
  enabled: { type: Boolean, default: true },
  changes: { type: String, required: true },
} as const).index({ appId: 1, versionNumber: 1 }, { unique: true }); // Only 1 doc per appId + versionNumber!

export const AppVersion = model('AppVersion', AppVersionSchema);

export const AppToolSchema = new Schema({
  appId: { type: Number, required: true },
  appVersion: { type: Number, required: true },
  toolPackageName: { type: String, required: true },
  toolVersion: { type: String, required: true },
  hiddenSupportedPolicies: [{ type: String }],
} as const).index(
  // Only 1 doc per app version + tool combination
  { appId: 1, appVersion: 1, toolPackageName: 1, toolVersion: 1 },
  { unique: true },
);

export const AppTool = model('AppTool', AppToolSchema);

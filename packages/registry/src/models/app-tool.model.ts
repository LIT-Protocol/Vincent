import mongoose, { Schema, Document } from 'mongoose';

export interface IAppTool extends Document {
  appId: number;
  appVersionNumber: number;
  toolPackageName: string;
  toolVersion: string;
  appVersionIdentity: string;
  toolIdentity: string;
  identity: string;
  hiddenSupportedPolicies: string[];
}

const AppToolSchema: Schema = new Schema({
  appId: { type: Number, required: true },
  appVersionNumber: { type: Number, required: true },
  toolPackageName: { type: String, required: true },
  toolVersion: { type: String, required: true },
  appVersionIdentity: { type: String, required: true },
  toolIdentity: { type: String, required: true },
  identity: { type: String, required: true, unique: true },
  hiddenSupportedPolicies: [{ type: String }],
});

// Compound index to ensure unique tool references per app version
AppToolSchema.index({ appVersionIdentity: 1, toolIdentity: 1 }, { unique: true });

export const AppTool = mongoose.model<IAppTool>('AppTool', AppToolSchema);

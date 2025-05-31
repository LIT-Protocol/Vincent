import { Schema, model } from 'mongoose';

const AppVersionSchema = new Schema({
  appId: { type: Number, required: true },
  versionNumber: { type: Number, required: true },
  id: { type: Number, required: true, unique: true },
  identity: { type: String, required: true, unique: true },
  enabled: { type: Boolean, default: true },
  changes: { type: String, required: true },
});

// Compound index to ensure unique version numbers per app
AppVersionSchema.index({ appId: 1, versionNumber: 1 }, { unique: true });

export const AppVersion = model('AppVersion', AppVersionSchema);

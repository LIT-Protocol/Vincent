import mongoose, { Schema, Document } from 'mongoose';

export interface IAppVersion extends Document {
  appId: number;
  versionNumber: number;
  id: number;
  identity: string;
  enabled: boolean;
  changes: string;
}

const AppVersionSchema: Schema = new Schema({
  appId: { type: Number, required: true },
  versionNumber: { type: Number, required: true },
  id: { type: Number, required: true, unique: true },
  identity: { type: String, required: true, unique: true },
  enabled: { type: Boolean, default: true },
  changes: { type: String, required: true },
});

// Compound index to ensure unique version numbers per app
AppVersionSchema.index({ appId: 1, versionNumber: 1 }, { unique: true });

export const AppVersion = mongoose.model<IAppVersion>('AppVersion', AppVersionSchema);

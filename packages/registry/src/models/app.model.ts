import mongoose, { Schema, Document } from 'mongoose';

export interface IApp extends Document {
  appId: number;
  identity: string;
  id: number;
  activeVersion: number;
  name: string;
  description: string;
  contactEmail: string;
  appUserUrl: string;
  logo?: string;
  redirectUrls: string[];
  deploymentStatus: 'dev' | 'prod' | 'test';
  managerAddress: string;
  lastUpdated: Date;
}

const AppSchema: Schema = new Schema({
  appId: { type: Number, required: true, unique: true },
  identity: { type: String, required: true, unique: true },
  id: { type: Number, required: true, unique: true },
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
  lastUpdated: { type: Date, default: Date.now },
});

export const App = mongoose.model<IApp>('App', AppSchema);

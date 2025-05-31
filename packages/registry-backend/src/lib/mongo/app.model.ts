import { Schema, model } from 'mongoose';

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
  },
  { timestamps: true },
);

export const App = model('App', AppSchema);

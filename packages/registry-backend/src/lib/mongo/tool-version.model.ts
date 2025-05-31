import { Schema, model } from 'mongoose';

const toolVersionSchema = new Schema(
  {
    packageName: { type: String, required: true },
    version: { type: String, required: true },
    identity: { type: String, required: true, unique: true },
    changes: { type: String, required: true },
    repository: { type: String, required: true },
    description: { type: String, required: true },
    keywords: [{ type: String }],
    dependencies: [{ type: String }],
    author: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      url: { type: String, required: true },
    },
    contributors: [
      {
        name: { type: String, required: true },
        email: { type: String, required: true },
        url: { type: String, required: true },
      },
    ],
    homepage: { type: String },
    status: {
      type: String,
      required: true,
      enum: ['validating', 'invalid', 'error', 'ready'],
      default: 'validating',
    },
    supportedPolicies: [{ type: String }],
    policiesNotInRegistry: [{ type: String }],
    ipfsCid: { type: String, required: true },
  },
  { timestamps: true },
);

// Compound index to ensure unique package name + version combinations
toolVersionSchema.index({ packageName: 1, version: 1 }, { unique: true });

export const ToolVersion = model('ToolVersion', toolVersionSchema);

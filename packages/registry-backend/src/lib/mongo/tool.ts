import { model, Schema } from 'mongoose';
import { uniquePackageVersion } from './indexes';

const toolSchema = new Schema(
  {
    packageName: { type: String, required: true, unique: true },
    authorWalletAddress: { type: String, required: true },
    description: { type: String, required: true },
    activeVersion: { type: Number, required: true },
  } as const,
  { timestamps: true },
);

export const Tool = model('Tool', toolSchema);

export const toolVersionSchema = new Schema(
  {
    packageName: { type: String, required: true },
    version: { type: Number, required: true },
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
  } as const,
  { timestamps: true },
);

toolVersionSchema.index(...uniquePackageVersion); // Compound index to ensure unique package name + version combinations

export const ToolVersion = model('ToolVersion', toolVersionSchema);

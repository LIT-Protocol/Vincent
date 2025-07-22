import { model, Schema } from 'mongoose';

import { undeletedByPackageIdentity, uniquePackageVersion } from './indexes';

const toolSchema = new Schema(
  {
    title: { type: String, required: true },
    packageName: { type: String, required: true, unique: true },
    authorWalletAddress: { type: String, required: true },
    description: { type: String, required: true },
    activeVersion: { type: String, required: true },
    deploymentStatus: {
      type: String,
      enum: ['dev', 'test', 'prod'],
      default: 'dev',
    },
    isDeleted: { type: Boolean, default: false, index: true },
  } as const,
  { timestamps: true },
);

export const Tool = model('Tool', toolSchema);

export const toolVersionSchema = new Schema(
  {
    packageName: { type: String, required: true },
    version: { type: String, required: true },
    changes: { type: String, required: true },
    repository: {
      type: { type: String },
      url: { type: String },
    },
    description: { type: String, required: true },
    keywords: [{ type: String }],
    dependencies: { type: Object, required: true },
    author: {
      name: { type: String },
      email: { type: String },
      url: { type: String },
    },
    contributors: [
      {
        name: { type: String },
        email: { type: String },
        url: { type: String },
      },
    ],
    homepage: { type: String },
    ipfsCid: { type: String, required: true },
    supportedPolicies: { type: Object },
    policiesNotInRegistry: [{ type: String }],
    isDeleted: { type: Boolean, default: false, index: true },
  } as const,
  { timestamps: true },
);

toolVersionSchema.index(...uniquePackageVersion); // Constraint: Compound index to ensure unique package name + version combinations
toolVersionSchema.index(...undeletedByPackageIdentity); // Performance optimization

export const ToolVersion = model('ToolVersion', toolVersionSchema);

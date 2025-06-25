import { model, Schema } from 'mongoose';
import { uniquePackageVersion } from './indexes';

const toolSchema = new Schema(
  {
    title: { type: String, required: true },
    packageName: { type: String, required: true, unique: true },
    authorWalletAddress: { type: String, required: true },
    description: { type: String, required: true },
    activeVersion: { type: String, required: true },
    isDeleted: { type: Boolean, default: false },
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
    // FIXME: Should these last 2 be [{ packageName, version}]?
    supportedPolicies: [{ type: String }],
    policiesNotInRegistry: [{ type: String }],
    isDeleted: { type: Boolean, default: false },
  } as const,
  { timestamps: true },
);

toolVersionSchema.index(...uniquePackageVersion); // Compound index to ensure unique package name + version combinations

export const ToolVersion = model('ToolVersion', toolVersionSchema);

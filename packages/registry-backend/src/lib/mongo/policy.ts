import { model, Schema } from 'mongoose';
import { uniquePackageVersion } from './indexes';

const policySchema = new Schema(
  {
    packageName: { type: String, required: true, unique: true },
    authorWalletAddress: { type: String, required: true },
    description: { type: String, required: true },
    activeVersion: { type: String, required: true },
  } as const,
  { timestamps: true },
);

export const Policy = model('Policy', policySchema);

export const policyVersionSchema = new Schema(
  {
    packageName: { type: String, required: true },
    version: { type: String, required: true, index: true },
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
    ipfsCid: { type: String, required: true },
    parameters: {
      uiSchema: { type: String, required: true },
      jsonSchema: { type: String, required: true },
    },
  } as const,
  { timestamps: true },
);

policyVersionSchema.index(...uniquePackageVersion);

export const PolicyVersion = model('PolicyVersion', policyVersionSchema);

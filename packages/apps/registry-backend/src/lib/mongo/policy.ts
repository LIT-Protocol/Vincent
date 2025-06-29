import { model, Schema } from 'mongoose';
import {
  undeletedByPackageIdentity,
  undeletedByPackageName,
  uniquePackageVersion,
} from './indexes';

const policySchema = new Schema(
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

export const Policy = model('Policy', policySchema);

export const policyVersionSchema = new Schema(
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
    parameters: {
      uiSchema: { type: String },
      jsonSchema: { type: String },
    },
    isDeleted: { type: Boolean, default: false, index: true },
  } as const,
  { timestamps: true },
);

policyVersionSchema.index(...uniquePackageVersion); // Constraint: Compound index to ensure unique package name + version combinations
policyVersionSchema.index(...undeletedByPackageName); // Performance optimization
policyVersionSchema.index(...undeletedByPackageIdentity); // Performance optimization

export const PolicyVersion = model('PolicyVersion', policyVersionSchema);

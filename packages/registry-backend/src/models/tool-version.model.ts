import mongoose, { Document, Schema } from 'mongoose';

export interface IToolVersion extends Document {
  packageName: string;
  version: string;
  identity: string;
  changes: string;
  repository: string;
  description: string;
  keywords: string[];
  dependencies: string[];
  author: {
    name: string;
    email: string;
    url: string;
  };
  contributors: Array<{
    name: string;
    email: string;
    url: string;
  }>;
  homepage?: string;
  status: 'validating' | 'invalid' | 'error' | 'ready';
  supportedPolicies: string[];
  policiesNotInRegistry: string[];
  ipfsCid: string;
  createdAt: Date;
  updatedAt: Date;
}

const toolVersionSchema = new Schema<IToolVersion>(
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

export const ToolVersion = mongoose.model<IToolVersion>('ToolVersion', toolVersionSchema);

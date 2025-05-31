import mongoose, { Document, Schema } from 'mongoose';

export interface IPolicy extends Document {
  packageName: string;
  identity: string;
  authorWalletAddress: string;
  description: string;
  activeVersion: string;
  createdAt: Date;
  updatedAt: Date;
}

const policySchema = new Schema<IPolicy>(
  {
    packageName: { type: String, required: true, unique: true },
    identity: { type: String, required: true, unique: true },
    authorWalletAddress: { type: String, required: true },
    description: { type: String, required: true },
    activeVersion: { type: String, required: true },
  },
  { timestamps: true },
);

export const Policy = mongoose.model<IPolicy>('Policy', policySchema);

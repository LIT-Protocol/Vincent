import { Schema, model } from 'mongoose';

const policySchema = new Schema(
  {
    packageName: { type: String, required: true, unique: true },
    authorWalletAddress: { type: String, required: true },
    description: { type: String, required: true },
    activeVersion: { type: String, required: true },
  },
  { timestamps: true },
);

export const Policy = model('Policy', policySchema);

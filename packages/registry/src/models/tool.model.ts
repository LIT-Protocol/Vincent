import mongoose, { Document, Schema } from 'mongoose';

export interface ITool extends Document {
  packageName: string;
  identity: string;
  authorWalletAddress: string;
  description: string;
  activeVersion: string;
  createdAt: Date;
  updatedAt: Date;
}

const toolSchema = new Schema<ITool>(
  {
    packageName: { type: String, required: true, unique: true },
    identity: { type: String, required: true, unique: true },
    authorWalletAddress: { type: String, required: true },
    description: { type: String, required: true },
    activeVersion: { type: String, required: true },
  },
  { timestamps: true },
);

export const Tool = mongoose.model<ITool>('Tool', toolSchema);

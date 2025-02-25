import { model, Schema } from 'mongoose';

export interface IUser {
  walletAddress: string;
  purchaseIntervalSeconds: number;
  registeredAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Schema is scoped to the IUser TS interface
const userSchema = new Schema<IUser>(
  {
    walletAddress: { type: String, unique: true, required: true },
    purchaseIntervalSeconds: { type: Number, required: true },
    registeredAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true }
);

// Model needs type hint generic for autocomplete to work on `.toObject()` results
export const User = model<IUser>('User', userSchema);

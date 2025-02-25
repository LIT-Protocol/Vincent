import { model, type PopulatedDoc, Schema } from 'mongoose';
import type { IUser } from './user.model';

interface IPurchasedCoin {
  user: PopulatedDoc<IUser>;
  coinAddress: string;
  symbol: string;
  amount: number;
  priceAtPurchase: number;
  txHash: string;
  purchasedAt: Date;
}

const purchasedCoinSchema = new Schema<IPurchasedCoin>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    coinAddress: { type: String, required: true },
    symbol: { type: String, required: true },
    amount: { type: Number, required: true },
    priceAtPurchase: { type: Number, required: true },
    txHash: { type: String, unique: true, required: true },
    purchasedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const PurchasedCoin = model<IPurchasedCoin>(
  'PurchasedCoin',
  purchasedCoinSchema
);

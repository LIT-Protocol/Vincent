import { model, Schema } from 'mongoose';

export interface UserAppInstallationDoc {
  userControllerAddress: string;
  appId: number;
  appVersion: number;
  agentSmartAccountAddress: string;
  agentSignerAddress: string; // PKP address
  serializedPermissionAccount: string;
  chainId: number; // Smart account chain ID
  createdAt: Date;
  updatedAt: Date;
}

const UserAppInstallationSchema = new Schema<UserAppInstallationDoc>(
  {
    userControllerAddress: {
      type: String,
      required: true,
      lowercase: true, // Normalize addresses to lowercase
    },
    appId: {
      type: Number,
      required: true,
    },
    appVersion: {
      type: Number,
      required: true,
    },
    agentSmartAccountAddress: {
      type: String,
      required: true,
      lowercase: true,
    },
    agentSignerAddress: {
      type: String,
      required: true,
      lowercase: true,
    },
    serializedPermissionAccount: {
      type: String,
      required: true,
    },
    chainId: {
      type: Number,
      required: true,
    },
  } as const,
  {
    timestamps: true,
  },
);

// Compound index for efficient lookups by user, app, and version
// Each PKP is tied to a specific app version, so we need all three
UserAppInstallationSchema.index(
  { userControllerAddress: 1, appId: 1, appVersion: 1, chainId: 1 },
  { unique: true },
);

// Index for lookups by smart account address
UserAppInstallationSchema.index({ agentSmartAccountAddress: 1, chainId: 1 });

// Index for finding active installations by user and app (to get latest version)
UserAppInstallationSchema.index({ userControllerAddress: 1, appId: 1, chainId: 1 });

export const UserAppInstallation = model<UserAppInstallationDoc>(
  'UserAppInstallation',
  UserAppInstallationSchema,
);

# Lit Actions for Contracts SDK

This directory contains Lit Actions for the Vincent Contracts SDK.

## Directory Structure

- `fees/` - Lit Actions related to fee contract operations
  - See [fees/README.md](./fees/README.md) for detailed documentation
- `generated/` - Build output (git-ignored)
  - Contains bundled JavaScript code and IPFS CID metadata

## Building

To build all Lit Actions:

```bash
# Build all Lit Actions
nx run contracts-sdk:action:build

# Or from the contracts-sdk directory
pnpm node ./esbuild.lit-actions.config.js
```

This will:

1. Bundle the TypeScript code using esbuild
2. Generate the JavaScript code string
3. Compute the IPFS CID hash
4. Create metadata files in the `generated/` directory

## Deploying

To deploy the Lit Actions to IPFS:

```bash
# Deploy all Lit Actions (requires PINATA_JWT in .env)
nx run contracts-sdk:action:deploy

# Or deploy without rebuilding
nx run contracts-sdk:action:only:deploy
```

This will upload the bundled code to IPFS via Pinata and verify the CID matches the metadata.

## Adding New Lit Actions

When adding new Lit Actions in the future:

1. Create a new directory for your feature (e.g., `my-feature/`)
2. Follow the same structure as `fees/`:
   - `internal/` - Internal helper functions
   - `raw-action-functions/` - Main Lit Action logic
   - `self-executing-actions/` - Self-executing wrappers (these get bundled)
   - `README.md` - Documentation specific to your feature
   - `tsconfig.json` - TypeScript configuration
3. Update `esbuild.lit-actions.config.js` to include your new entry points
4. Update `scripts/deploy-lit-action.js` to deploy your new Lit Actions
5. Add tests and documentation

## Existing Lit Actions

- **Owner Attestation Signing** (`fees/`) - Signs owner attestations for fee withdrawal operations
  - See [fees/README.md](./fees/README.md) for details

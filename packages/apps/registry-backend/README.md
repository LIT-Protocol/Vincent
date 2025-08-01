# Vincent API

A RESTful API service for managing abilities, policies, and applications in the Vincent ecosystem. Built with Express.js, TypeScript, and MongoDB.

## Overview

Vincent API provides a secure, scalable backend for managing:

- **Abilities** - Reusable code components with versioning support
- **Policies** - Access control and governance rules with versioning
- **Applications** - Complete applications built using abilities and policies

## Features

- 🔒 **Type-safe** - Full TypeScript support with strict typing
- 📝 **OpenAPI validation** - Request/response validation with OpenAPI specifications
- 🗄️ **MongoDB integration** - Using Mongoose for data modeling
- 🧪 **Testing ready** - Jest testing framework configured

## Tech Stack

- **Runtime**: Node.js with TypeScript 5.0
- **Framework**: Express.js 5.1
- **Database**: MongoDB with Mongoose 8.15
- **Validation**: express-openapi-validator
- **Package Manager**: pnpm

## Getting Started

### Prerequisites

- Node.js 18+ (with pnpm)
- MongoDB instance
- TypeScript 5.0+

### Development

Copy .env.example to `.env`, and configure your MongoDB env vars at a minimum.

```bash
# Install dependencies
pnpm install

# Build the project
pnpm build

# Start development server
pnpm dev
```

Once the server is running, open http://localhost:3000/openapi.html to see the RapiDoc API playground w/ routes and example payloads

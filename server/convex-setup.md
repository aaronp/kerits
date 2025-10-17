# Convex Setup Instructions

This document explains how to connect your existing Convex project to the messagebus application.

## Prerequisites

- An existing Convex account and project
- Convex CLI installed (`bun install -g convex`)

## Setup Steps

### 1. Initialize Convex in this project

```bash
bunx convex dev
```

This will:
- Prompt you to log in to your Convex account (if not already logged in)
- Let you select your existing project or create a new one
- Generate a `convex/` directory with your schema and functions
- Create a `.env.local` file with your `CONVEX_URL`

### 2. Verify your `.env.local` file

After running `bunx convex dev`, you should have a `.env.local` file that looks like:

```
CONVEX_URL=https://your-deployment-name.convex.cloud
```

This is the deployment URL that the messagebus client, CLI, and tests will use.

### 3. Deploy the messagebus functions

The Convex functions for the messagebus are located in `convex/messages.ts`. When you run `bunx convex dev`, these functions will automatically be deployed to your Convex project.

### 4. Verify deployment

You can verify the functions are deployed by:
- Checking the Convex dashboard at https://dashboard.convex.dev
- Running the integration tests: `make test`
- Using the CLI tool: `bun run cli`

## Environment Variables

The application uses the following environment variables:

- `CONVEX_URL` - Your Convex deployment URL (automatically set by `bunx convex dev`)

## Running the Application

Once setup is complete:

```bash
# Run the CLI for manual testing
bun run cli

# Run integration tests
make test

# Keep Convex dev server running (for real-time updates)
bunx convex dev
```

## Troubleshooting

**Issue**: `CONVEX_URL is not defined`
- **Solution**: Make sure `.env.local` exists and contains your `CONVEX_URL`

**Issue**: Functions not found
- **Solution**: Ensure `bunx convex dev` is running and functions are deployed

**Issue**: Authentication errors
- **Solution**: Run `bunx convex login` to authenticate with your Convex account

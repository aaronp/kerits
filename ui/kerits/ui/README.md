# KERI Demo UI

Interactive web interface for demonstrating KERI (Key Event Receipt Infrastructure) functionality.

## Features

- **Identity Management**: Create and manage KERI identities (AIDs)
- **Schema Management**: Define credential schemas
- **Credential Management**: Issue and accept verifiable credentials
- **Network Visualization**: Interactive graph showing KEL and TEL events
- **Real-time Updates**: Watch events flow through the system

## Tech Stack

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: Zustand
- **Graph Visualization**: react-flow
- **KERI Library**: Shared from `../src`

## Getting Started

### Prerequisites

- Bun (or Node.js 18+)

### Installation

```bash
# Install dependencies
make install
# or
bun install
```

### Development

```bash
# Start development server
make dev
# or
bun run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production

```bash
# Build static site
make build
# or
bun run build
```

The output will be in the `dist/` directory.

### Preview Production Build

```bash
# Preview production build
make preview
# or
bun run preview
```

## Project Structure

```
ui/
├── src/
│   ├── components/
│   │   ├── ui/              # shadcn/ui components
│   │   ├── IdentityCreator.tsx
│   │   ├── SchemaManager.tsx
│   │   ├── CredentialIssuer.tsx
│   │   ├── CredentialAcceptor.tsx
│   │   ├── KELViewer.tsx
│   │   ├── TELViewer.tsx
│   │   └── NetworkGraph.tsx
│   ├── lib/
│   │   ├── utils.ts         # Utility functions
│   │   ├── keri.ts          # KERI library imports
│   │   └── storage.ts       # Browser storage
│   ├── store/
│   │   └── useStore.ts      # Zustand state
│   ├── App.tsx
│   └── main.tsx
├── public/
├── Makefile
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## Deployment to GitHub Pages

1. Update the `base` path in `vite.config.ts` to match your repository name:
   ```ts
   base: '/your-repo-name/'
   ```

2. Build the project:
   ```bash
   make build
   ```

3. Deploy the `dist/` folder to GitHub Pages:
   ```bash
   # Using gh-pages CLI
   npx gh-pages -d dist

   # Or manually push to gh-pages branch
   git subtree push --prefix kerits/ui/dist origin gh-pages
   ```

## Development

### Adding New Components

Use shadcn/ui for consistent UI components:

```bash
# Example: Add a dialog component
npx shadcn-ui@latest add dialog
```

### Importing KERI Functions

Import KERI functions from the shared library:

```typescript
import { incept, credential, verifyCredential } from '@/lib/keri';
```

### Storage

Demo data is stored in browser localStorage via `src/lib/storage.ts`.

## License

MIT

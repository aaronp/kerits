.PHONY: dev build preview clean install

# Run development server
dev:
	@echo "Starting development server..."
	@bun run dev

# Build for production
build:
	@echo "Building for production..."
	@bun run build

# Preview production build
preview:
	@echo "Previewing production build..."
	@bun run preview

# Install dependencies
install:
	@echo "Installing dependencies..."
	@bun install

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	@rm -rf dist node_modules/.vite

# Deploy to GitHub Pages
deploy: build
	@echo "Deploying to GitHub Pages..."
	@echo "Run: gh-pages -d dist"
	@echo "Or manually push the dist/ folder to gh-pages branch"

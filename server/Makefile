.PHONY: test install dev cli clean

# Run integration tests
test:
	@echo "Running integration tests..."
	@if [ ! -f .env.local ]; then \
		echo "Error: .env.local file not found"; \
		echo "Please run 'bunx convex dev' first to set up your Convex deployment"; \
		exit 1; \
	fi
	@export $$(grep -v '^#' .env.local | sed 's/#.*//g' | xargs) && bun test tests/integration.test.ts

# Install dependencies
install:
	bun install

# Start Convex dev server
dev:
	bunx convex dev

# Run CLI tool
cli:
	@if [ ! -f .env.local ]; then \
		echo "Error: .env.local file not found"; \
		echo "Please run 'make dev' first to set up your Convex deployment"; \
		exit 1; \
	fi
	@export $$(grep -v '^#' .env.local | sed 's/#.*//g' | xargs) && bun run cli

# Clean up generated files
clean:
	rm -rf node_modules
	rm -rf convex/_generated

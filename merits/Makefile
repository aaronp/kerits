.PHONY: dev start install clean test client

# Development mode with auto-reload
dev:
	bun --watch index.ts

# Start server (production mode)
start:
	bun run index.ts

# Install dependencies
install:
	bun install

# Clean node_modules
clean:
	rm -rf node_modules bun.lockb

# Test API endpoints
test:
	@echo "Testing MERITS API endpoints..."
	@sleep 1
	@curl -s http://localhost:3000/ | jq .
	@curl -s http://localhost:3000/hello | jq .
	@curl -s http://localhost:3000/hello/World | jq .

# Run Eden client test
client:
	bun run client.ts

# Help
help:
	@echo "MERITS API Server - Available targets:"
	@echo "  make dev      - Run server in development mode (auto-reload)"
	@echo "  make start    - Run server in production mode"
	@echo "  make install  - Install dependencies"
	@echo "  make clean    - Remove node_modules"
	@echo "  make test     - Test API endpoints with curl"
	@echo "  make client   - Run Eden Treaty client test"

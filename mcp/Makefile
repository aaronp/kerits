.PHONY: dev start install clean test

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

# Test with MCP inspector
test:
	npx @modelcontextprotocol/inspector bun run index.ts

# Help
help:
	@echo "KERITS MCP Server - Available targets:"
	@echo "  make dev      - Run server in development mode (auto-reload)"
	@echo "  make start    - Run server in production mode"
	@echo "  make install  - Install dependencies"
	@echo "  make clean    - Remove node_modules"
	@echo "  make test     - Test with MCP inspector"

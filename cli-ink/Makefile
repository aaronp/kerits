.PHONY: cli cli-demo dev demo advanced install clean help

# Default target
help:
	@echo "KERITS CLI-Ink - Available targets:"
	@echo ""
	@echo "  make cli        - Run full KERITS CLI application"
	@echo "  make cli-demo   - Run CLI menu navigation demo (12 seconds)"
	@echo "  make dev        - Run interactive CLI (old prototype)"
	@echo "  make demo       - Run basic graph demo (5 second display)"
	@echo "  make advanced   - Run advanced graph demo with boxes & lines (8 seconds)"
	@echo "  make install    - Install dependencies"
	@echo "  make clean      - Remove node_modules"
	@echo ""

# Run full KERITS CLI
cli:
	@bun run cli.tsx

# Run CLI navigation demo
cli-demo:
	@bun run cli-demo.tsx

# Run interactive CLI (old prototype)
dev:
	@bun run index.tsx

# Run basic demo (works without interactive terminal)
demo:
	@bun run demo.tsx

# Run advanced graph demo with Dagre layout
advanced:
	@bun run advanced-demo.tsx

# Install dependencies
install:
	@bun install

# Clean
clean:
	@rm -rf node_modules
	@rm -f bun.lockb

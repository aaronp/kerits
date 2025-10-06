.PHONY: dev demo install clean help

# Default target
help:
	@echo "KERITS CLI-Ink - Available targets:"
	@echo ""
	@echo "  make dev        - Run interactive CLI (requires interactive terminal)"
	@echo "  make demo       - Run static graph demo (5 second display)"
	@echo "  make install    - Install dependencies"
	@echo "  make clean      - Remove node_modules"
	@echo ""

# Run interactive CLI
dev:
	@bun run index.tsx

# Run static demo (works without interactive terminal)
demo:
	@bun run demo.tsx

# Install dependencies
install:
	@bun install

# Clean
clean:
	@rm -rf node_modules
	@rm -f bun.lockb

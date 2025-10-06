.PHONY: dev install clean help

help:
	@echo "KERITS CLI - Available targets:"
	@echo ""
	@echo "  make dev      - Run the CLI"
	@echo "  make install  - Install dependencies"
	@echo "  make clean    - Clean node_modules"
	@echo ""

dev:
	bun run start

install:
	bun install

clean:
	rm -rf node_modules bun.lock
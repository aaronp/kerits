.PHONY: help test typecheck

REPO_ROOT   := $(shell git rev-parse --show-toplevel)
PACKAGE_DIR := $(REPO_ROOT)/packages/core

help:
	@echo "@kerits/core - Package build targets"
	@echo ""
	@echo "Available targets:"
	@echo "  make test        - Run tests"
	@echo "  make typecheck   - Run TypeScript type checking"

typecheck:
	@TC_TMP=$$(mktemp); \
	bun run typecheck > $$TC_TMP 2>&1; \
	grep -v "node_modules" $$TC_TMP | grep -E "error TS|^\$$" || true; \
	if grep -v "node_modules" $$TC_TMP | grep -q "error TS"; then \
		rm -f $$TC_TMP; \
		echo "TypeScript type checking failed"; \
		exit 1; \
	fi; \
	rm -f $$TC_TMP; \
	echo "TypeScript type checking passed"

test:
	@bun test
	@echo "✅ @kerits/core tests pass."

.DEFAULT_GOAL := help

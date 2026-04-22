.PHONY: help test typecheck docs-build serve

REPO_ROOT   := $(shell git rev-parse --show-toplevel)
PACKAGE_DIR := $(REPO_ROOT)/packages/core
SERVE_PORT  := 4000

help:
	@echo "@kerits/core - Package build targets"
	@echo ""
	@echo "Available targets:"
	@echo "  make test        - Run tests, regenerate architecture MDX, and build the docs site"
	@echo "  make typecheck   - Run TypeScript type checking"
	@echo "  make docs-build  - Regenerate MDX (via docs:ci gate) and build the static docs site"
	@echo "  make serve       - Build and serve the static docs site at http://localhost:$(SERVE_PORT)"

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

test: docs-build
	@echo "✅ @kerits/core tests pass, generated MDX is up to date, docs site built."

# Regenerate MDX via the docs:ci gate (clean → test → check → merge → regen → diff-gate),
# then build the static docs site into packages/core/docs/out/.
docs-build:
	@echo "📦 Running @kerits/core tests and regenerating architecture docs..."
	@cd $(REPO_ROOT) && bun run docs:ci
	@echo "📖 Building @kerits/core docs site..."
	@cd $(PACKAGE_DIR)/docs && bun run build
	@echo "✅ Docs site built in packages/core/docs/out/"

# Serve the built static site. Next.js static export references assets at /_next/...
# (absolute paths), so file:// won't work — a static HTTP server is required.
# The in-repo serve-static.ts handles clean URLs (/foo → out/foo.html) via Bun.serve.
serve: docs-build
	@echo "🌐 Serving docs at http://localhost:$(SERVE_PORT) (Ctrl+C to stop)..."
	@cd $(PACKAGE_DIR)/docs && PORT=$(SERVE_PORT) bun scripts/serve-static.ts

.DEFAULT_GOAL := help

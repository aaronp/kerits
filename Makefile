.PHONY: test verify unit ui-test test-auth test-kerits test-model clean coverage coverage-model check check-kerits typecheck typecheck-kerits help

# ============================================================================
# Help
# ============================================================================

help:
	@echo "Kerits Build System"
	@echo ""
	@echo "Test Targets:"
	@echo "  make test            - Run all tests (kerits + UI + server)"
	@echo "  make test-kerits     - Run only kerits core tests (./src)"
	@echo "  make test-model      - Run model tests (./src/model)"
	@echo "  make test-auth       - Run auth integration tests"
	@echo "  make ui-test         - Run UI/MERITS tests only"
	@echo "  make unit            - Run unit tests"
	@echo "  make verify          - Run testgen verification"
	@echo ""
	@echo "Type Checking:"
	@echo "  make typecheck       - Type check everything"
	@echo "  make typecheck-kerits - Type check kerits core only"
	@echo ""
	@echo "Quality Checks:"
	@echo "  make check           - Full quality check (typecheck + coverage + verify)"
	@echo "  make check-kerits    - Kerits-only check (typecheck-kerits + test-kerits)"
	@echo "  make coverage        - Run tests with coverage"
	@echo "  make coverage-model  - Run model tests with HTML coverage report"
	@echo ""
	@echo "Utilities:"
	@echo "  make clean           - Remove build artifacts and node_modules"
	@echo "  make help            - Show this help message"

# ============================================================================
# Test Targets
# ============================================================================

# Run the full test suite (compatibility tests + unit tests + UI tests)
test:
	@bun test $$(find src test -name "*.test.ts" -not -path "*/ui/*")
	@echo ""
	@echo "Running UI/MERITS tests..."
	@cd ui && bun test

# Run verify (test runner for testgen integration)
verify:
	@bun run src/test-runner.ts

# Run unit tests only
unit:
	@bun test $$(find src test -name "*.test.ts" -not -path "*/ui/*")

# Run UI/MERITS tests only
ui-test:
	@cd ui && bun test

# Run authentication integration test
test-auth:
	@echo "🔐 Running auth integration test..."
	@cd server && bun test tests/auth-integration.test.ts

# ============================================================================
# Kerits Core Targets (./src - schemas, storage, events, credentials)
# ============================================================================

# Run only kerits core tests (./src tests, excluding ui/server)
test-kerits:
	@echo "🧪 Running kerits core tests..."
	@bun test $$(find src -name "*.test.ts" -not -path "*/app/*" -not -path "*/cesr/*")

# Run model tests (./src/model)
test-model: 
	@echo "🏗️  Running model tests..."
	@bun test $$(find src/model -name "*.test.ts")

check-model: typecheck test-model
	@echo "🏗️  Checking model..."

# ============================================================================
# Type Checking
# ============================================================================

typecheck:
	@echo "🔍 Type checking core (src only, excluding ui/cli/mcp)..."
	@tsc --project tsconfig.check.json 2>&1 | grep -v "node_modules/" || true
	@if tsc --project tsconfig.check.json 2>&1 | grep -v "node_modules/" | grep "error TS" > /dev/null; then \
		echo "❌ Type errors found in source code"; \
		exit 1; \
	else \
		echo "✅ Type check passed"; \
	fi

# Type check kerits core library (./src, excluding app/cesr/indexeddb)
typecheck-kerits:
	@echo "🔍 Type checking kerits core library..."
	@tsc --project tsconfig.kerits.json 2>&1 | grep -v "node_modules/" || true
	@if tsc --project tsconfig.kerits.json 2>&1 | grep -v "node_modules/" | grep "error TS" > /dev/null; then \
		echo "❌ Type errors found in kerits core"; \
		exit 1; \
	else \
		echo "✅ Kerits type check passed"; \
	fi

# ============================================================================
# Coverage & Quality
# ============================================================================

coverage:
	@bun test --coverage
	@echo "✅ Coverage complete"

# Run model tests with HTML coverage report
coverage-model:
	@echo "📊 Running model tests with HTML coverage report..."
	@bun test --coverage --coverage-reporter=text --coverage-reporter=lcov $$(find src/model -name "*.test.ts")
	@if command -v genhtml >/dev/null 2>&1; then \
		echo "📊 Generating HTML coverage report..."; \
		genhtml -o coverage/html coverage/lcov.info; \
		echo "✅ HTML coverage report generated in coverage/html/index.html"; \
	else \
		echo "⚠️  genhtml not found. Install lcov package to generate HTML reports:"; \
		echo "   brew install lcov  # macOS"; \
		echo "   apt-get install lcov  # Ubuntu/Debian"; \
		echo "   yum install lcov  # CentOS/RHEL"; \
		echo "✅ Text coverage report generated in coverage/lcov.info"; \
	fi

# Clean build artifacts and node_modules
clean:
	@rm -rf node_modules
	@rm -f bun.lock

# ============================================================================
# Composite Targets
# ============================================================================

# Full quality check (typecheck + coverage + auth tests + verify)
check: typecheck coverage test-auth verify

# Kerits-only check (type check + tests)
check-kerits: typecheck-kerits test-kerits

.DEFAULT_GOAL := check

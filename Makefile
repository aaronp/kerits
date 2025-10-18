.PHONY: test verify unit ui-test test-auth clean coverage check typecheck

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

# Clean build artifacts and node_modules
clean:
	@rm -rf node_modules
	@rm -f bun.lock

typecheck:
	@echo "🔍 Type checking core (src only, excluding ui/cli/mcp)..."
	@tsc --project tsconfig.check.json 2>&1 | grep -v "node_modules/" || true
	@if tsc --project tsconfig.check.json 2>&1 | grep -v "node_modules/" | grep "error TS" > /dev/null; then \
		echo "❌ Type errors found in source code"; \
		exit 1; \
	else \
		echo "✅ Type check passed"; \
	fi

coverage:
	@bun test --coverage
	@echo "✅ Coverage complete"

check: typecheck coverage test-auth verify

.DEFAULT_GOAL := check

.PHONY: test verify unit clean

# Run the full test suite (compatibility tests + unit tests)
test:
	@echo "Running compatibility tests..."
	@bun run src/test-runner.ts
	@echo ""
	@echo "Running unit tests..."
	@bun test $$(find src test -name "*.test.ts" -not -path "*/ui/*")

# Run verify (test runner for testgen integration)
verify:
	@bun run src/test-runner.ts

# Run unit tests only
unit:
	@bun test $$(find src test -name "*.test.ts" -not -path "*/ui/*")

# Clean build artifacts and node_modules
clean:
	@rm -rf node_modules
	@rm -f bun.lock

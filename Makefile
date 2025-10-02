.PHONY: test verify clean

# Run the test suite (same as verify for feature parity)
test:
	@bun run src/test-runner.ts

# Run verify (test runner for testgen integration)
verify:
	@bun run src/test-runner.ts

# Clean build artifacts and node_modules
clean:
	@rm -rf node_modules
	@rm -f bun.lock

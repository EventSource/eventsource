VERSION := $(shell node -e "console.log(JSON.parse(require('fs').readFileSync('package.json', 'utf8')).version)")

run-tests: node_modules
	@NODE_PATH=lib ./node_modules/.bin/nodeunit test
.PHONY: run-tests

publish:
	npm publish && git tag v$(VERSION) -m "Release v$(VERSION)" && git push && git push --tags
.PHONY: publish

node_modules: package.json
	npm link
	touch $@

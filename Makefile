VERSION := $(shell node -e "console.log(JSON.parse(require('fs').readFileSync('package.json', 'utf8')).version)")

run-tests: node_modules
	@NODE_PATH=lib ./node_modules/.bin/mocha --reporter spec
.PHONY: run-tests

clobber:
	git clean -dfx
.PHONY: clobber

publish: node_modules
	npm publish && git tag v$(VERSION) -m "Release v$(VERSION)" && git push && git push --tags
.PHONY: publish

node_modules: package.json
	npm install
	touch $@


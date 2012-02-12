VERSION := $(shell node -e "console.log(JSON.parse(require('fs').readFileSync('package.json', 'utf8')).version)")

run-tests: node_modules lib/eventstream.js
	@NODE_PATH=lib ./node_modules/.bin/nodeunit test
.PHONY: run-tests

clobber:
	rm lib/eventstream.js
	git clean -dfx
.PHONY: clobber

lib/eventstream.js: lib/eventstream.jison node_modules
	./node_modules/.bin/jison -o $@ lib/eventstream.jison

publish: lib/eventstream.js
	npm publish && git tag v$(VERSION) -m "Release v$(VERSION)" && git push && git push --tags
.PHONY: publish

doc/eventsource.json:
	@mkdir -p doc
	NODE_PATH=lib ./node_modules/.bin/dox < lib/eventsource.js > doc/eventsource.json

node_modules: package.json
	npm install
	touch $@


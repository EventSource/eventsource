VERSION := $(shell node -e "console.log(JSON.parse(require('fs').readFileSync('package.json', 'utf8')).version)")

run-tests:
	@NODE_PATH=lib ./node_modules/.bin/nodeunit test

parser:
	./node_modules/.bin/jison -o lib/parser.js lib/grammar.jison

publish:
	npm publish && git tag v$(VERSION) -m "Release v$(VERSION)" && git push && git push --tags

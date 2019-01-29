# Change log

All notable changes to this package will be documented in this file.
This project adheres to [Semantic Versioning](http://semver.org).

## [1.0.0] - 2019-01-29
First release from this fork. Changes from the previous release of the upstream code (1.0.7) are as follows:

### Added:
- The optional `method` and `body` properties of the constructor options allow you to specify a different HTTP method from the default of `GET`, and to provide a request body if the specified method allows a body.

### Changed:
- The EventSource constructor is now a named export, not a default export. This is necessary in order to avoid a problem that  can happen when using Babel with ES6 code: the logic for converting CJS imports to ES6 imports does not work correctly if the default import has properties (`CONNECTING`, `OPEN`, `CLOSED`) but is also a function. Note that this is a breaking change if you were previously using the upstream code, but the only thing that needs to be changed is the import statement.

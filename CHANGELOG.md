# Change log

All notable changes to this package will be documented in this file.
This project adheres to [Semantic Versioning](http://semver.org).

## [1.0.8] - 2019-01-29
First release from this fork. Changes from the 1.0.7 release of the upstream code are  as follows:
### Added:
- The optional `method` and `body` properties of the constructor options allow you to specify a different HTTP method from the default of `GET`, and to provide a request body if the specified method allows a body.

### Changed:
- The EventSource constructor is now a named export, not a default export. This is for better compatibility with ES6 code.

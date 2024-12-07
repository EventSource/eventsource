<!-- markdownlint-disable --><!-- textlint-disable -->

# 📓 Changelog

All notable changes to this project will be documented in this file. See
[Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [3.0.0](https://github.com/EventSource/eventsource/compare/v2.0.2...v3.0.0) (2024-12-07)

### ⚠ BREAKING CHANGES

* Drop support for Node.js versions below v18
* The module now uses a named export instead of a default export.
* UMD bundle dropped. Use a bundler.
* `headers` in init dict dropped, pass a custom `fetch` function instead.
* HTTP/HTTPS proxy support dropped. Pass a custom `fetch` function instead.
* `https.*` options dropped. Pass a custom `fetch` function that provides an agent/dispatcher instead.
* New default reconnect delay: 3 seconds instead of 1 second.
* Reconnecting after a redirect will now always use the original URL, even if the status code was HTTP 307.

### Features

* modernize - use `fetch`, WebStreams, TypeScript, ESM ([#330](https://github.com/EventSource/eventsource/issues/330)) ([40655f7](https://github.com/EventSource/eventsource/commit/40655f7c418b8fff274e471c47f5fd2acd056318))

### Bug Fixes

* `dispatchEvent` now emits entire event object ([eb430c0](https://github.com/EventSource/eventsource/commit/eb430c0d70941956fb1042b946806c3adef94061))
* empty options no longer disable certificate checks ([372d387](https://github.com/EventSource/eventsource/commit/372d387b0ca0046e798f272bbe8f42a002103c3a))

## [2.0.2](https://github.com/EventSource/eventsource/compare/v2.0.1...v2.0.2) (2022-05-12)


### Bug Fixes

* strip sensitive headers on redirect to different origin ([10ee0c4](https://github.com/EventSource/eventsource/commit/10ee0c4881a6ba2fe65ec18ed195ac35889583c4))


## [2.0.1](https://github.com/EventSource/eventsource/compare/v2.0.0...v2.0.1) (2022-04-25)

### Bug Fixes

* Fix `URL is not a constructor` error for browser ([#268](https://github.com/EventSource/eventsource/pull/268) Ajinkya Rajput)

# [2.0.0](https://github.com/EventSource/eventsource/compare/v1.1.0...v2.0.0) (2022-03-02)

### ⚠ BREAKING CHANGES

* Node >= 12 now required ([#152](https://github.com/EventSource/eventsource/pull/152) @HonkingGoose)

### Bug Fixes

* Preallocate buffer size when reading data for increased performance with large messages ([#239](https://github.com/EventSource/eventsource/pull/239) Pau Freixes)
* Removed dependency on url-parser. Fixes [CVE-2022-0512](https://www.whitesourcesoftware.com/vulnerability-database/CVE-2022-0512) & [CVE-2022-0691](https://nvd.nist.gov/vuln/detail/CVE-2022-0691) ([#249](https://github.com/EventSource/eventsource/pull/249) Alex Hladin)

### Bug Fixes

* NPM download badge links to malware ([8954d63](https://github.com/EventSource/eventsource/commit/8954d633f0b222a79d1650b05f37e9d118c27ed5))

# [1.1.2](https://github.com/EventSource/eventsource/compare/v1.1.1...v1.1.2) (2022-06-08)

### Features

* Inline origin resolution, drops `original` dependency ([#281](https://github.com/EventSource/eventsource/pull/281) Espen Hovlandsdal)

# [1.1.1](https://github.com/EventSource/eventsource/compare/v1.1.0...v1.1.1) (2022-05-11)

### Bug Fixes

* Do not include authorization and cookie headers on redirect to different origin ([#273](https://github.com/EventSource/eventsource/pull/273) Espen Hovlandsdal)

# [1.1.0](https://github.com/EventSource/eventsource/compare/v1.0.7...v1.1.0) (2021-03-18)

### Features

* Improve performance for large messages across many chunks ([#130](https://github.com/EventSource/eventsource/pull/130) Trent Willis)
* Add `createConnection` option for http or https requests ([#120](https://github.com/EventSource/eventsource/pull/120) Vasily Lavrov)
* Support HTTP 302 redirects ([#116](https://github.com/EventSource/eventsource/pull/116) Ryan Bonte)

### Bug Fixes

* Prevent sequential errors from attempting multiple reconnections ([#125](https://github.com/EventSource/eventsource/pull/125) David Patty)
* Add `new` to correct test ([#111](https://github.com/EventSource/eventsource/pull/101) Stéphane Alnet)
* Fix reconnections attempts now happen more than once ([#136](https://github.com/EventSource/eventsource/pull/136) Icy Fish)

## [1.0.7](https://github.com/EventSource/eventsource/compare/v1.0.6...v1.0.7) (2018-08-27)

### Features

* Add dispatchEvent to EventSource ([#101](https://github.com/EventSource/eventsource/pull/101) Ali Afroozeh)
* Added `checkServerIdentity` option ([#104](https://github.com/EventSource/eventsource/pull/104) cintolas)
* Surface request error message ([#107](https://github.com/EventSource/eventsource/pull/107) RasPhilCo)

## [1.0.6](https://github.com/EventSource/eventsource/compare/v1.0.5...v1.0.6) (2018-08-23)

### Bug Fixes

* Fix issue where a unicode sequence split in two chunks would lead to invalid messages ([#108](https://github.com/EventSource/eventsource/pull/108) Espen Hovlandsdal)

## [1.0.5](https://github.com/EventSource/eventsource/compare/v1.0.4...v1.0.5) (2017-07-18)

### Bug Fixes

* Check for `window` existing before polyfilling. ([#80](https://github.com/EventSource/eventsource/pull/80) Neftaly Hernandez)

## [1.0.4](https://github.com/EventSource/eventsource/compare/v1.0.2...v1.0.4) (2017-06-19)

### Bug Fixes

* Pass withCredentials on to the XHR. ([#79](https://github.com/EventSource/eventsource/pull/79) Ken Mayer)

## [1.0.2](https://github.com/EventSource/eventsource/compare/v1.0.1...v1.0.2) (2017-05-28)

### Bug Fixes

* Fix proxy not working when proxy and target URL uses different protocols. ([#76](https://github.com/EventSource/eventsource/pull/76) Espen Hovlandsdal)
* Make `close()` a prototype method instead of an instance method. ([#77](https://github.com/EventSource/eventsource/pull/77) Espen Hovlandsdal)

## [1.0.1](https://github.com/EventSource/eventsource/compare/v1.0.0...v1.0.1) (2017-05-10)

### Bug Fixes

* Reconnect if server responds with HTTP 500, 502, 503 or 504. ([#74](https://github.com/EventSource/eventsource/pull/74) Vykintas Narmontas)

# [1.0.0](https://github.com/EventSource/eventsource/compare/v0.2.3...v1.0.0) (2017-04-17)

### Features

* Add missing `removeEventListener`-method. ([#51](https://github.com/EventSource/eventsource/pull/51) Yucheng Tu / Espen Hovlandsdal)
* Add ability to customize https options. ([#53](https://github.com/EventSource/eventsource/pull/53) Rafael Alfaro)
* Add readyState constants to EventSource instances. ([#66](https://github.com/EventSource/eventsource/pull/66) Espen Hovlandsdal)

### Bug Fixes

* Fix EventSource reconnecting on non-200 responses. ([af84476](https://github.com/EventSource/eventsource/commit/af84476b519a01e61b8c80727261df52ae40022c) Espen Hovlandsdal)

## [0.2.3](https://github.com/EventSource/eventsource/compare/v0.2.2...v0.2.3) (2017-04-17)

### Bug Fixes

* Fix `onConnectionClosed` firing multiple times resulting in multiple connections. ([#61](https://github.com/EventSource/eventsource/pull/61) Phil Strong / Duncan Wong)

### Reverts

* Revert "Protects against multiple connects" ([3887a4a](https://github.com/EventSource/eventsource/commit/3887a4af701c3ec307d5866f26eb442433d43fda))

## [0.2.2](https://github.com/EventSource/eventsource/compare/v0.2.1...v0.2.2) (2017-02-28)

### Bug Fixes

* Don't include test files in npm package. ([#56](https://github.com/EventSource/eventsource/pull/56) eanplatter)

## [0.2.1](https://github.com/EventSource/eventsource/compare/v0.2.0...v0.2.1) (2016-02-28)

### Features

* Add http/https proxy function. ([#46](https://github.com/EventSource/eventsource/pull/46) Eric Lu)
* Drop support for Node 0.10.x and older (Aslak Hellesøy).

### Bug Fixes

* Fix `close()` for polyfill. ([#52](https://github.com/EventSource/eventsource/pull/52) brian-medendorp)
* Fix reconnect for polyfill. Only disable reconnect when server status is 204. (Aslak Hellesøy).

# [0.2.0](https://github.com/EventSource/eventsource/compare/v0.1.6...v0.2.0) (2016-02-11)

### Features

* Renamed repository to `eventsource` (since it's not just Node, but also browser polyfill). (Aslak Hellesøy).
* Compatibility with webpack/browserify. ([#44](https://github.com/EventSource/eventsource/pull/44) Adriano Raiano).

## [0.1.6](https://github.com/EventSource/eventsource/compare/v0.1.5...v0.1.6) (2015-02-09)

### Bug Fixes

* Ignore headers without a value. ([#41](https://github.com/EventSource/eventsource/issues/41), [#43](https://github.com/EventSource/eventsource/pull/43) Adriano Raiano)

## [0.1.5](https://github.com/EventSource/eventsource/compare/v0.1.4...v0.1.5) (2015-02-08)

### Features

* Refactor tests to support Node.js 0.12.0 and Io.js 1.1.0. (Aslak Hellesøy)

## [0.1.4](https://github.com/EventSource/eventsource/compare/v0.1.3...v0.1.4) (2014-10-31)

### Features

* Expose `status` property on `error` events. ([#40](https://github.com/EventSource/eventsource/pull/40) Adriano Raiano)

### Bug Fixes

* Added missing origin property. ([#39](https://github.com/EventSource/eventsource/pull/39), [#38](https://github.com/EventSource/eventsource/issues/38) Arnout Kazemier)

## [0.1.3](https://github.com/EventSource/eventsource/compare/v0.1.2...v0.1.3) (2014-09-17)

### Bug Fixes

* Made message properties enumerable. ([#37](https://github.com/EventSource/eventsource/pull/37) Golo Roden)

## [0.1.2](https://github.com/EventSource/eventsource/compare/v0.1.1...v0.1.2) (2014-08-07)

### Bug Fixes

* Blank lines not read. ([#35](https://github.com/EventSource/eventsource/issues/35), [#36](https://github.com/EventSource/eventsource/pull/36) Lesterpig)

## [0.1.1](https://github.com/EventSource/eventsource/compare/v0.1.0...v0.1.1) (2014-05-18)

### Bug Fixes

* Fix message type. ([#33](https://github.com/EventSource/eventsource/pull/33) Romain Gauthier)

# [0.1.0](https://github.com/EventSource/eventsource/compare/v0.0.10...v0.1.0) (2014-03-07)

### Bug Fixes

* High CPU usage by replacing Jison with port of WebKit's parser. ([#25](https://github.com/EventSource/eventsource/issues/25), [#32](https://github.com/EventSource/eventsource/pull/32), [#18](https://github.com/EventSource/eventsource/issues/18) qqueue)

## [0.0.10](https://github.com/EventSource/eventsource/compare/v0.0.9...v0.0.10) (2013-11-21)

### Features

* Provide `Event` argument on `open` and `error` event ([#30](https://github.com/EventSource/eventsource/issues/30), [#31](https://github.com/EventSource/eventsource/pull/31) Donghwan Kim)
* Expose `lastEventId` on messages. ([#28](https://github.com/EventSource/eventsource/pull/28) mbieser)

## [0.0.9](https://github.com/EventSource/eventsource/compare/v0.0.8...v0.0.9) (2013-10-24)

### Bug Fixes

* Old "last-event-id" used on reconnect ([#27](https://github.com/EventSource/eventsource/pull/27) Aslak Hellesøy)

## [0.0.8](https://github.com/EventSource/eventsource/compare/v0.0.7...v0.0.8) (2013-09-12)

### Features

* Allow unauthorized HTTPS connections by setting `rejectUnauthorized` to false. (Aslak Hellesøy)

### Bug Fixes

* EventSource still reconnected when closed ([#24](https://github.com/EventSource/eventsource/pull/24) FrozenCow)

## [0.0.7](https://github.com/EventSource/eventsource/compare/v0.0.6...v0.0.7) (2013-04-19)

### Features

* Explicitly raise an error when server returns http 403 and don't continue ([#20](https://github.com/EventSource/eventsource/pull/20) Scott Moak)
* Added ability to send custom http headers to server ([#21](https://github.com/EventSource/eventsource/pull/21), [#9](https://github.com/EventSource/eventsource/issues/9) Scott Moak)
* Switched from testing with Nodeunit to Mocha (Aslak Hellesøy)

### Bug Fixes

* Fix Unicode support to cope with Javascript Unicode size limitations ([#23](https://github.com/EventSource/eventsource/pull/23), [#22](https://github.com/EventSource/eventsource/issues/22) Devon Adkisson)
* Graceful handling of parse errors ([#19](https://github.com/EventSource/eventsource/issues/19) Aslak Hellesøy)

## [0.0.6](https://github.com/EventSource/eventsource/compare/v0.0.5...v0.0.6) (2013-01-24)

### Features

* Add Accept: text/event-stream header ([#17](https://github.com/EventSource/eventsource/pull/17) William Wicks)

## [0.0.5](https://github.com/EventSource/eventsource/compare/v0.0.4...v0.0.5) (2012-02-12)

### Features

* Add no-cache and https support ([#10](https://github.com/EventSource/eventsource/pull/10) Einar Otto Stangvik)
* Ensure that Last-Event-ID is sent to the server for reconnects, as defined in the spec ([#8](https://github.com/EventSource/eventsource/pull/8) Einar Otto Stangvik)
* Verify that CR and CRLF are accepted alongside LF ([#7](https://github.com/EventSource/eventsource/pull/7) Einar Otto Stangvik)
* Emit 'open' event ([#4](https://github.com/EventSource/eventsource/issues/4) Einar Otto Stangvik)

## [0.0.4](https://github.com/EventSource/eventsource/compare/v0.0.3...v0.0.4) (2012-02-10)

### Features

* Automatic reconnect every second if the server is down. Reconnect interval can be set with `reconnectInterval` (not in W3C spec). (Aslak Hellesøy)

## [0.0.3](https://github.com/EventSource/eventsource/compare/v0.0.2...v0.0.3) (2012-02-10)

### Features

* Jison based eventstream parser ([#2](https://github.com/EventSource/eventsource/pull/2) Einar Otto Stangvik)

## [0.0.2](https://github.com/EventSource/eventsource/compare/v0.0.1...v0.0.2) (2012-02-08)

### Features

* Use native EventListener (Aslak Hellesøy)

## 0.0.1 (2012-02-08)

### Features

* First release (Aslak Hellesøy)

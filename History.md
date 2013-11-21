# [0.0.10](https://github.com/aslakhellesoy/eventsource-node/compare/v0.0.9...v0.0.10)

* Provide `Event` argument on `open` and `error` event ([#30](https://github.com/aslakhellesoy/eventsource-node/issues/30), [#31](https://github.com/aslakhellesoy/eventsource-node/pull/31) Donghwan Kim)
* Expose `lastEventId` on messages. ([#28](https://github.com/aslakhellesoy/eventsource-node/pull/28) mbieser)

# [0.0.9](https://github.com/aslakhellesoy/eventsource-node/compare/v0.0.8...v0.0.9)

* Bugfix: old "last-event-id" used on reconnect ([#27](https://github.com/aslakhellesoy/eventsource-node/pull/27) Aslak Hellesøy) 

# [0.0.8](https://github.com/aslakhellesoy/eventsource-node/compare/v0.0.7...v0.0.8)

* Bugfix: EventSource still reconnected when closed ([#24](https://github.com/aslakhellesoy/eventsource-node/pull/24) FrozenCow) 
* Allow unauthorized HTTPS connections by setting `rejectUnauthorized` to false. (Aslak Hellesøy)

# [0.0.7](https://github.com/aslakhellesoy/eventsource-node/compare/v0.0.6...v0.0.7)

* Explicitly raise an error when server returns http 403 and dont continue ([#20](https://github.com/aslakhellesoy/eventsource-node/pull/20) Scott Moak)
* Added ability to send custom http headers to server ([#21](https://github.com/aslakhellesoy/eventsource-node/pull/21), [#9](https://github.com/aslakhellesoy/eventsource-node/issues/9) Scott Moak)
* Fix Unicode support to cope with Javascript Unicode size limitations ([#23](https://github.com/aslakhellesoy/eventsource-node/pull/23), [#22](https://github.com/aslakhellesoy/eventsource-node/issues/22) Devon Adkisson)
* Graceful handling of parse errors ([#19](https://github.com/aslakhellesoy/eventsource-node/issues/19) Aslak Hellesøy)
* Switched from testing with Nodeunit to Mocha (Aslak Hellesøy)

# [0.0.6](https://github.com/aslakhellesoy/eventsource-node/compare/v0.0.5...v0.0.6)

* Add Accept: text/event-stream header ([#17](https://github.com/aslakhellesoy/eventsource-node/pull/17) William Wicks)

# [0.0.5](https://github.com/aslakhellesoy/eventsource-node/compare/v0.0.4...v0.0.5)

* Add no-cache and https support ([#10](https://github.com/aslakhellesoy/eventsource-node/pull/10) Einar Otto Stangvik)
* Ensure that Last-Event-ID is sent to the server for reconnects, as defined in the spec ([#8](https://github.com/aslakhellesoy/eventsource-node/pull/8) Einar Otto Stangvik)
* Verify that CR and CRLF are accepted alongside LF ([#7](https://github.com/aslakhellesoy/eventsource-node/pull/7) Einar Otto Stangvik)
* Emit 'open' event ([#4](https://github.com/aslakhellesoy/eventsource-node/issues/4) Einar Otto Stangvik)

# [0.0.4](https://github.com/aslakhellesoy/eventsource-node/compare/v0.0.3...v0.0.4)

* Automatic reconnect every second if the server is down. Reconnect interval can be set with `reconnectInterval` (not in W3C spec). (Aslak Hellesøy)

# [0.0.3](https://github.com/aslakhellesoy/eventsource-node/compare/v0.0.2...v0.0.3)

* Jison based eventstream parser ([#2](https://github.com/aslakhellesoy/eventsource-node/pull/2) Einar Otto Stangvik)

# [0.0.2](https://github.com/aslakhellesoy/eventsource-node/compare/v0.0.1...v0.0.2)

* Use native EventListener (Aslak Hellesøy)

# 0.0.1

* First release

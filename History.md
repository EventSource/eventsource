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

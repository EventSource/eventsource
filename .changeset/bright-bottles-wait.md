---
"eventsource": major
---

- **BREAKING CHANGE:** The client now fails the connection, emitting an error without reconnecting, if the parser buffers 100 MB without receiving a valid, complete EventSource line. Configure a different limit with `maxBufferSize`; ideally, servers should emit smaller chunks or newlines more frequently.
- **BREAKING CHANGE:** Node.js 22.12 or later is now required. Older Node.js versions may still work, but are not supported or guaranteed going forward because Node.js 20 is out of LTS.
- **BREAKING CHANGE:** The separate CommonJS variant is no longer published. Node.js 22.12 and later transparently supports `require()` of ESM, so most CommonJS consumers should continue to work. This removes the dual-package hazard.
- **BREAKING CHANGE:** Chrome versions before 84, Safari before 15, Firefox before 105, Edge before 84, and JavaScript environments without private fields, methods, and accessors are no longer supported.
- **BREAKING CHANGE:** When both an `on*` property handler and an `addEventListener()` listener are registered for the same event, they now run in registration order instead of always running the `on*` handler first. Code that relied on the old order can observe a different callback sequence.
- Unref reconnection timers where the runtime supports it, so pending reconnects do not keep the process alive.

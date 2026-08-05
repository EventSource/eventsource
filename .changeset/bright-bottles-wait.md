---
"eventsource": major
---

- Require Node.js 22.12 or later, modern browsers with private class fields, methods, and accessors, Deno 2, or Bun 1.1.23. The CommonJS bundle is no longer published.
- Add the `maxBufferSize` constructor option. It defaults to 100 MB; exceeding the limit closes the connection and emits an error without reconnecting.
- Dispatch `onopen`, `onmessage`, and `onerror` handlers in their registration order relative to `addEventListener()` handlers.
- Unref reconnection timers where the runtime supports it, so pending reconnects do not keep the process alive.

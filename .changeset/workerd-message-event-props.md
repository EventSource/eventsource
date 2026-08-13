---
'eventsource': patch
---

Fixed `origin` and `lastEventId` being empty on Cloudflare Workers

workerd accepts `data` from the `MessageEvent` constructor's init dictionary but silently drops `origin` and `lastEventId`, so message events dispatched on Cloudflare Workers arrived with `origin` set to `null` and `lastEventId` to an empty string. Both are now assigned explicitly when the constructor did not take them, which leaves every other runtime untouched.

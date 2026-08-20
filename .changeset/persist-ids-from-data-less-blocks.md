---
'eventsource': patch
---

Fixed ID-only event blocks not updating `MessageEvent.lastEventId` or `Last-Event-ID` on reconnect.

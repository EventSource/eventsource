---
'eventsource': patch
---

Stop dispatching events once the EventSource has been closed

If multiple server-sent events were buffered in the same chunk and an event listener called `close()` while the first event was being dispatched, any remaining buffered events would still be dispatched even though `readyState` was `CLOSED`. Event dispatch now stops once the connection is closed, per the EventSource specification's event dispatch steps.

Fixes #362

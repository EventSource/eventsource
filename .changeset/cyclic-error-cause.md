---
'eventsource': patch
---

Fix a stack overflow when `fetch()` rejects with an error whose `cause` chain loops back on itself. The `error` event now fires and the connection reconnects as usual.

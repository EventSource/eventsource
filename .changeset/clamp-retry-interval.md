---
"eventsource": patch
---

Clamp the server-sent `retry` value to the maximum timer delay, so a very large value no longer causes a reconnect attempt every millisecond

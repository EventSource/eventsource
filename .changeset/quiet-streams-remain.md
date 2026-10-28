---
'eventsource': patch
---

Copy URL objects during construction so later caller mutations do not change the exposed URL or reconnection target.

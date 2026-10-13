---
'eventsource': patch
---

Fixed `Last-Event-ID` not being sent as UTF-8 on reconnect

The event ID was passed to `fetch()` as a plain string header value, but header values are byte strings. An ID containing a character above U+00FF, eg `€`, made `fetch()` throw a `TypeError` on every reconnect attempt, so the connection was never re-established. An ID with characters in the U+0080 to U+00FF range, eg `é`, was sent as a single Latin-1 byte instead of its UTF-8 encoding. The header now carries the UTF-8 bytes of the ID, as the specification requires.

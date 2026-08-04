---
'eventsource': patch
---

Allow a `value` of any type in `ReaderLike` done-results. TypeScript 5.9's DOM lib types `ReadableStreamDefaultReader.read()`'s done-result as `{done: true, value: T | undefined}`, so a custom `fetch` returning a `Response`-shaped body no longer satisfied `FetchLikeResponse` on TypeScript 5.9 and newer, forcing consumers to hand-wrap the reader.

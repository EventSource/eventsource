---
'eventsource': minor
---

Typed response body chunks as buffers instead of `unknown`

`ReaderLike` typed chunks read off the response body as `unknown`, but they are handed to a `TextDecoder`, which only accepts buffers and throws on anything else. So a reader yielding anything else was never usable, and the type said otherwise. It also hid a type error in the client itself, which only surfaces when compiling against TypeScript's `dom` library: the node typings resolve the chunk to `any`, while the `dom` library resolves it to `{}`.

Chunks are now typed as `Uint8Array | DataView | ArrayBuffer`, which is what both the node and DOM typings accept, and which every `fetch()` implementation yields. Nothing changes at runtime.

If you pass a custom `fetch()` that returns a hand-rolled body, and your reader's chunk type is wider than the above, eg `unknown` or `any`, it will no longer be assignable. Returning a real `Response`, or a reader that yields `Uint8Array` chunks, is unaffected.

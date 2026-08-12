---
'eventsource': minor
---

Made the exported `EventSource` type structural, so other implementations can satisfy it

`EventSource` was exported as a class holding hard-private (`#`) fields, which makes TypeScript emit a `#private` brand into the declaration file and turns the exported type nominal. A consumer writing `function connect(es: EventSource)` against this package could not pass the native `EventSource`, a mock, or any other implementation, even when the shape matched exactly.

The implementation class is now internal, and `EventSource` is exported as an `interface` plus a const holding the constructor. As a result:

- The native `EventSource`, along with mocks and stubs, is assignable to the exported `EventSource` type
- The exported value and `globalThis.EventSource` are interchangeable in both directions, which helps libraries that accept an EventSource implementation to construct
- A new `EventSourceConstructor` type is exported for that case

Nothing changes at runtime: `new EventSource(...)`, `instanceof`, subclassing, the readyState statics, `EventSource.name`, inspected output and the `eventsource.supports-fetch-override` symbol all behave as before, and the internal state is still held in real `#private` fields.

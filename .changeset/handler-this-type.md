---
'eventsource': minor
---

Declared the `this` type for the `onerror`, `onmessage` and `onopen` properties

`addEventListener()` already declared that listeners are called with the EventSource instance as `this`, but the `on*` properties did not, so `this` was an implicit `any` in handlers assigned to them (an error under `noImplicitThis`). They now match `addEventListener()` and the native `EventSource`:

```ts
eventSource.onmessage = function (event) {
  console.log(this.url, event.data) // `this` is now typed
}
```

Handlers that declare an incompatible `this`, eg an unbound class method typed with `this: MyClass`, will now be rejected where they were previously accepted. Arrow functions and handlers that ignore `this` are unaffected.

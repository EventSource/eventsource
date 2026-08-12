/**
 * Ensures that our EventSource polyfill is as type-compatible as possible with the
 * WhatWG EventSource implementation/types (defined in TypeScript's `lib.dom.d.ts`).
 *
 * Checked against the built declarations in `dist`, since those - not the source - are what
 * consumers of the published package see. Run with `npm run test:types`; the file is only
 * ever type checked, never executed.
 */
import {
  type EventSourceConstructor,
  EventSource as EventSourcePolyfill,
  type EventSourceInit,
  type FetchLike,
} from '../dist/index.js'

/** A native `EventSource`, as typed by TypeScript's `lib.dom.d.ts` */
declare const native: globalThis.EventSource

/**
 * Anything that satisfies our public constructor type must be usable through the full API,
 * including the native `EventSource` - which is passed in below.
 */
function testESImpl(EvtSource: EventSourceConstructor) {
  const es = new EvtSource('https://foo.bar', {
    withCredentials: true,
  }) satisfies globalThis.EventSource

  /* eslint-disable no-console */

  // Message.
  // Both the `on*` properties and `addEventListener` declare the `this` type, so it is inferred
  // for inline handlers. Standalone function declarations still have to annotate it, since
  // TypeScript only contextually types `this` for function expressions.
  es.onmessage = function (evt) {
    console.log(typeof evt.data === 'string')
    console.log(evt.defaultPrevented === false)
    console.log(evt.type === 'message')
    console.log(this === es)
  }

  function onMessage(this: EventSourcePolyfill, evt: MessageEvent) {
    console.log(typeof evt.data === 'string')
    console.log(evt.defaultPrevented === false)
    console.log(evt.type === 'message')
    console.log(this === es)
  }

  es.addEventListener('message', onMessage)
  es.removeEventListener('message', onMessage)

  es.addEventListener('message', function (evt) {
    console.log(this.url, evt.data)
  })

  // Error
  es.onerror = function (event) {
    console.log(event.defaultPrevented === false)
    console.log(event.type === 'error')
    console.log(this === es)
  }

  function onError(this: EventSourcePolyfill, event: Event) {
    console.log(event.defaultPrevented === false)
    console.log(event.type === 'error')
    console.log(this === es)
  }

  es.addEventListener('error', onError)
  es.removeEventListener('error', onError)

  // Our `error` events carry non-spec extras, which must survive on the listener signature
  es.addEventListener('error', (event) => {
    console.log(event.code === 500, event.message === 'Internal Server Error')
  })

  // Open
  es.onopen = function (event) {
    console.log(event.defaultPrevented === false)
    console.log(event.type === 'open')
    console.log(this === es)
  }

  function onOpen(this: EventSourcePolyfill, event: Event) {
    console.log(event.defaultPrevented === false)
    console.log(event.type === 'open')
    console.log(this === es)
  }

  es.addEventListener('open', onOpen)
  es.removeEventListener('open', onOpen)

  // Properties
  console.log(es.readyState === 0 || es.readyState === 1 || es.readyState === 2)
  console.log(es.url === 'https://foo.bar')
  console.log(es.withCredentials === true)

  console.log(es.CLOSED === 2)
  console.log(es.OPEN === 1)
  console.log(es.CONNECTING === 0)

  // Methods
  es.close()
}

testESImpl(EventSourcePolyfill)
testESImpl(globalThis.EventSource)

/**
 * The exported `EventSource` type must be structural, eg free of the `#private` brand that
 * TypeScript emits into declaration files for classes holding hard-private (`#`) fields.
 * That brand makes the type nominal, which prevents consumers from passing the native
 * `EventSource`, a mock, or another implementation where our type is expected.
 */
function testStructuralCompat() {
  // A native `EventSource` must be assignable to our exported type
  const nativeAsPolyfill: EventSourcePolyfill = native

  // …as must a hand-rolled stub, for consumers mocking the client in their tests
  const mock: EventSourcePolyfill = {
    CONNECTING: 0,
    OPEN: 1,
    CLOSED: 2,
    readyState: 1,
    url: 'https://foo.bar',
    withCredentials: false,
    onerror: null,
    onmessage: null,
    onopen: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => true,
    close: () => {},
  }

  // The constructor must be interchangeable with the native one, in both directions
  const nativeCtor: EventSourceConstructor = globalThis.EventSource
  const polyfillCtor: typeof globalThis.EventSource = EventSourcePolyfill

  return [nativeAsPolyfill, mock, nativeCtor, polyfillCtor]
}

testStructuralCompat()

/**
 * Consumers must still be able to subclass the exported `EventSource`, and instances of such
 * subclasses must remain assignable to both our type and the native one.
 */
function testSubclassing() {
  class WrappedEventSource extends EventSourcePolyfill {
    public reconnects = 0

    override close(): void {
      super.close()
    }
  }

  const wrapped = new WrappedEventSource('https://foo.bar', {withCredentials: true})
  return [wrapped satisfies EventSourcePolyfill, wrapped satisfies globalThis.EventSource]
}

testSubclassing()

/**
 * `FetchLike` must accept standard fetch implementations: TypeScript 5.9's DOM lib types
 * `ReadableStreamDefaultReader.read()`'s done-result as `{done: true, value: T | undefined}`,
 * which `ReaderLike` needs to allow for `Response`-shaped bodies (and structurally compatible
 * streams like `ReadableStream<Uint8Array<ArrayBufferLike>>`) to remain assignable.
 */
function testFetchCompat() {
  const globalFetchInit: EventSourceInit = {fetch: globalThis.fetch}

  const customStreamFetch: FetchLike = async (url, init) => {
    const res = await globalThis.fetch(url, init)
    const body: ReadableStream<Uint8Array<ArrayBufferLike>> | null = res.body
    return {
      body,
      url: res.url,
      status: res.status,
      redirected: res.redirected,
      headers: res.headers,
    }
  }

  return [globalFetchInit, {fetch: customStreamFetch} satisfies EventSourceInit]
}

testFetchCompat()

new EventSourcePolyfill('https://foo.bar', {
  maxBufferSize: 1024,
}).close()

import {expect, test, vi} from 'vitest'

import {
  type ErrorEvent,
  EventSource as OurEventSource,
  type EventSourceFetchInit,
  type FetchLike,
} from '../src/index.ts'
import {deferClose, getCallCounter} from './helpers/callCounter.ts'
import {
  crossOrigin,
  crossOriginUrl,
  esInit,
  hasBrowserSemantics,
  request,
  serverOrigin,
  serverUrl,
  suite,
} from './helpers/env.ts'
import {unicodeLines} from './helpers/fixtures.ts'

/** Only meaningful where CORS, cookies and `withCredentials` are actually enforced. */
const browserTest = test.runIf(hasBrowserSemantics)

/**
 * happy-dom copies the full header list onto a redirected request and only ever deletes the
 * cookie headers, so `Authorization` survives a redirect to a different origin - which the fetch
 * spec requires it not to (https://fetch.spec.whatwg.org/#http-redirect-fetch, step 13). Asserted
 * as a known failure rather than skipped, so that this turns red - and the workaround gets
 * removed - the moment happy-dom starts stripping the header.
 */
const xOriginRedirectTest = suite === 'happy-dom' ? test.fails : test

/**
 * workerd's `EventTarget` dispatches `on<type>` handler properties itself, on top of the
 * `addEventListener` call our `on*` setters make, so those handlers fire more than once, assigning
 * `null` only removes one registration, and they fire ahead of listeners registered before them
 * (https://github.com/cloudflare/workerd/issues/6022). Asserted as known failures rather than
 * skipped, so that these turn red - and the workaround gets removed - once workerd stops
 * dispatching the handler properties itself.
 *
 * Note that not every `on*` test trips this: the two that only ever register a single handler and
 * check that it fired still pass, so they are left as ordinary tests.
 */
const onHandlerTest = suite === 'workerd' ? test.fails : test

test('can connect, receive message, manually disconnect', async () => {
  const onMessage = getCallCounter({name: 'onMessage'})
  const es = new OurEventSource(new URL(`${serverUrl}/`))
  es.addEventListener('welcome', onMessage.listener, false)

  await onMessage.waitForCallCount(1)

  expect(onMessage.callCount).toBe(1)
  expect(onMessage.lastArg).toMatchObject({
    data: 'Hello, world!',
    origin: serverOrigin,
  })

  await deferClose(es)
})

test('`target` on open, message and error events is the EventSource instance', async () => {
  const onOpen = getCallCounter<Event>({name: 'onOpen'})
  const onMessage = getCallCounter({name: 'onMessage'})
  const onError = getCallCounter<ErrorEvent>({name: 'onError'})
  const es = new OurEventSource(`${serverUrl}/end-after-one`)

  es.addEventListener('open', onOpen.listener)
  es.addEventListener('progress', onMessage.listener)
  es.addEventListener('error', onError.listener)

  await onOpen.waitForCallCount(1)
  await onMessage.waitForCallCount(1)
  await onError.waitForCallCount(1)

  expect(onOpen.lastArg.target).toBe(es)
  expect(onMessage.lastArg.target).toBe(es)
  expect(onError.lastArg.target).toBe(es)

  await deferClose(es)
})

test('can connect using URL string only', async () => {
  const es = new OurEventSource(`${serverUrl}/`)
  const onMessage = getCallCounter({name: 'onMessage'})
  es.addEventListener('welcome', onMessage.listener, false)

  await onMessage.waitForCallCount(1)
  await deferClose(es)
})

test('passes `no-store` to `fetch`, avoiding cache', async () => {
  let passedInit: EventSourceFetchInit | undefined

  const onMessage = getCallCounter({name: 'onMessage'})
  const es = new OurEventSource(new URL(`${serverUrl}/debug`), {
    fetch: (url, init) => {
      passedInit = init
      return request(url, init)
    },
  })

  es.addEventListener('debug', onMessage.listener, false)
  await onMessage.waitForCallCount(1)

  expect(passedInit).toMatchObject({cache: 'no-store'})
  await deferClose(es)
})

test('can handle unicode data correctly', async () => {
  const onMessage = getCallCounter({name: 'onMessage'})
  const es = new OurEventSource(`${serverUrl}/unicode`, esInit)

  const messages: Array<{data: string}> = []
  es.addEventListener('unicode', (evt) => {
    messages.push(evt)
    onMessage.listener(evt)
  })

  await onMessage.waitForCallCount(2)
  expect(messages[0]?.data).toBe(unicodeLines[0])
  expect(messages[1]?.data).toBe(unicodeLines[1])

  await deferClose(es)
})

test('can use `es.onopen` to listen for open events, nulling it unsubscribes', async () => {
  const onError = getCallCounter<ErrorEvent>({name: 'onError'})
  const onOpen = getCallCounter<Event>({name: 'onOpen'})
  const es = new OurEventSource(`${serverUrl}/counter`, esInit)
  es.addEventListener('error', onError.listener)
  es.onopen = onOpen.listener

  await onOpen.waitForCallCount(2)
  es.onopen = null

  await onError.waitForCallCount(4) // 4 disconnects

  // If `es.onopen = null` did not work, this should be 4
  expect(onOpen.callCount).toBe(2)
  await deferClose(es)
})

onHandlerTest(
  'can use `es.onerror` to listen for error events, nulling it unsubscribes',
  async () => {
    const onError = getCallCounter<ErrorEvent>({name: 'onError'})
    const onOpen = getCallCounter<Event>({name: 'onOpen'})
    const es = new OurEventSource(`${serverUrl}/counter`, esInit)
    es.addEventListener('open', onOpen.listener)
    es.onerror = onError.listener

    await onOpen.waitForCallCount(3)
    es.onerror = null

    await onOpen.waitForCallCount(4) // 4 connects

    // If `es.onerror = null` did not work, this should be 4
    expect(onError.callCount).toBe(2)
    await deferClose(es)
  },
)

onHandlerTest(
  'can use `es.onmessage` to listen for explicit `message` events, nulling it unsubscribes',
  async () => {
    const onMessage = getCallCounter({name: 'onMessage'})
    const onError = getCallCounter<ErrorEvent>({name: 'onError'})
    const es = new OurEventSource(`${serverUrl}/counter?event=message`, esInit)
    es.addEventListener('error', onError.listener)
    es.onmessage = onMessage.listener

    await onError.waitForCallCount(2)
    es.onmessage = null

    await onError.waitForCallCount(3) // 3 disconnects

    // If `es.onmessage = null` did not work, this should be 9,
    // since each connect emits 3 message then closes
    expect(onMessage.callCount).toBe(6)
    await deferClose(es)
  },
)

onHandlerTest(
  'can use `es.onmessage` to listen for implicit `message` events, nulling it unsubscribes',
  async () => {
    const onMessage = getCallCounter({name: 'onMessage'})
    const onError = getCallCounter<ErrorEvent>({name: 'onError'})
    const es = new OurEventSource(`${serverUrl}/counter?event=`, esInit)
    es.addEventListener('error', onError.listener)
    es.onmessage = onMessage.listener

    await onError.waitForCallCount(2)
    es.onmessage = null

    await onError.waitForCallCount(3) // 3 disconnects

    // If `es.onmessage = null` did not work, this should be 9,
    // since each connect emits 3 message then closes
    expect(onMessage.callCount).toBe(6)
    await deferClose(es)
  },
)

test('`es.onmessage` does not fire for non-`message` events', async () => {
  const onMessage = getCallCounter({name: 'onMessage'})
  const onOpen = getCallCounter<Event>({name: 'onOpen'})
  const es = new OurEventSource(`${serverUrl}/counter`, esInit)
  es.addEventListener('open', onOpen.listener)
  es.onmessage = onMessage.listener

  await onOpen.waitForCallCount(3)
  es.onmessage = null

  // `event` was never "message" (or blank), only ever `counter`
  expect(onMessage.callCount).toBe(0)
  await deferClose(es)
})

onHandlerTest('can redeclare `es.onopen` after initial assignment', async () => {
  const onError = getCallCounter<ErrorEvent>({name: 'onError'})
  const onOpen = getCallCounter<Event>({name: 'onOpen'})
  const onOpenNew = getCallCounter<Event>({name: 'onOpen (new)'})
  const es = new OurEventSource(`${serverUrl}/counter`, esInit)
  es.addEventListener('error', onError.listener)
  es.onopen = onOpen.listener

  await onOpen.waitForCallCount(2)
  es.onopen = onOpenNew.listener

  await onError.waitForCallCount(4) // 4 disconnects

  // If `es.onopen = <new-fn>` did not work, this should be 4
  expect(onOpen.callCount).toBe(2)
  expect(onOpenNew.callCount).toBe(2)
  await deferClose(es)
})

onHandlerTest('can redeclare `es.onerror` after initial assignment', async () => {
  const onError = getCallCounter<ErrorEvent>({name: 'onError'})
  const onErrorNew = getCallCounter<ErrorEvent>({name: 'onError (new)'})
  const onOpen = getCallCounter<Event>({name: 'onOpen'})
  const es = new OurEventSource(`${serverUrl}/counter`, esInit)
  es.addEventListener('open', onOpen.listener)
  es.onerror = onError.listener

  await onOpen.waitForCallCount(3)
  es.onerror = onErrorNew.listener

  await onOpen.waitForCallCount(4) // 4 connects

  // If `es.onerror = <new-fn>` did not work, this should be 4
  expect(onError.callCount).toBe(2)
  expect(onErrorNew.callCount).toBe(1)
  await deferClose(es)
})

onHandlerTest('can redeclare `es.onmessage` after initial assignment', async () => {
  const onMessage = getCallCounter({name: 'onMessage'})
  const onMessageNew = getCallCounter({name: 'onMessage (new)'})
  const onError = getCallCounter<ErrorEvent>({name: 'onError'})
  const es = new OurEventSource(`${serverUrl}/counter?event=message`, esInit)
  es.addEventListener('error', onError.listener)
  es.onmessage = onMessage.listener

  await onError.waitForCallCount(2)
  es.onmessage = onMessageNew.listener

  await onError.waitForCallCount(3) // 3 disconnects

  // If `es.onmessage = <new-fn>` did not work, this should be 9,
  // since each connect emits 3 message then closes
  expect(onMessage.callCount).toBe(6)
  expect(onMessageNew.callCount).toBe(3)
  await deferClose(es)
})

onHandlerTest('on-handlers fire in registration order relative to `addEventListener`', async () => {
  const order: string[] = []
  const onOpen = getCallCounter<Event>({name: 'onOpen'})
  const es = new OurEventSource(`${serverUrl}/`, esInit)

  // `addEventListener` is registered _before_ the `onopen` handler is assigned, so per spec
  // the `addEventListener` callback must fire first (the event handler IDL attribute fires
  // in the order it was set, relative to other listeners).
  es.addEventListener('open', () => order.push('addEventListener'))
  es.onopen = (event) => {
    order.push('onopen')
    onOpen.listener(event)
  }

  await onOpen.waitForCallCount(1)

  expect(order[0], 'first handler to fire').toBe('addEventListener')
  expect(order[1], 'second handler to fire').toBe('onopen')

  await deferClose(es)
})

test('message event contains correct properties', async () => {
  const onMessage = getCallCounter({name: 'onMessage'})
  const es = new OurEventSource(`${serverUrl}/counter`, esInit)

  es.addEventListener('counter', onMessage.listener)
  await onMessage.waitForCallCount(1)

  expect(onMessage.lastArg).toMatchObject({
    data: 'Counter is at 1',
    type: 'counter',
    lastEventId: '1',
    origin: serverOrigin,
    defaultPrevented: false,
    cancelable: false,
    timeStamp: expect.any(Number),
  })
  await deferClose(es)
})

test('will reconnect with last received message id if server disconnects', async () => {
  const onMessage = getCallCounter({name: 'onMessage'})
  const onError = getCallCounter<ErrorEvent>({name: 'onError'})
  const url = `${serverUrl}/counter`
  const es = new OurEventSource(url, esInit)
  es.addEventListener('counter', onMessage.listener)
  es.addEventListener('error', onError.listener)

  // While still receiving messages (we receive 3 at a time before it disconnects)
  await onMessage.waitForCallCount(1)
  expect(es.readyState, 'readyState').toBe(OurEventSource.OPEN) // Open (connected)

  // While waiting for reconnect (after 3 messages it will disconnect and reconnect)
  await onError.waitForCallCount(1)
  expect(es.readyState, 'readyState').toBe(OurEventSource.CONNECTING) // Connecting (reconnecting)
  expect(onMessage.callCount).toBe(3)

  // Will reconnect infinitely, stop at 8 messages
  await onMessage.waitForCallCount(8)

  expect(es.url).toBe(url)
  expect(onMessage.lastArg).toMatchObject({
    data: 'Counter is at 8',
    type: 'counter',
    lastEventId: '8',
    origin: serverOrigin,
  })
  expect(onMessage.callCount).toBe(8)

  await deferClose(es)
})

test('will not reconnect after explicit `close()`', async () => {
  const onMessage = getCallCounter({name: 'onMessage'})
  const onError = getCallCounter<ErrorEvent>({name: 'onError'})
  const clientId = Math.random().toString(36).slice(2)
  const url = `${serverUrl}/identified?client-id=${clientId}`
  const es = new OurEventSource(url, esInit)

  es.addEventListener('message', onMessage.listener)
  es.addEventListener('error', onError.listener)

  // Should receive a message containing the number of listeners on the given ID
  await onMessage.waitForCallCount(1)
  expect(onMessage.lastArg).toMatchObject({data: '1'})
  expect(es.readyState, 'readyState').toBe(OurEventSource.OPEN) // Open (connected)

  // Explicitly disconnect. Should normally reconnect within ~250ms (server sends retry: 250)
  // but we'll close it before that happens
  es.close()
  expect(es.readyState, 'readyState').toBe(OurEventSource.CLOSED)
  expect(onMessage.callCount).toBe(1)

  // After 500 ms, there should still only be a single connect with this client ID
  await new Promise((resolve) => setTimeout(resolve, 500))
  expect(await request(url).then((res) => res.json())).toMatchObject({clientIdConnects: 1})

  // Wait another 500 ms, just to be sure there are no slow reconnects
  await new Promise((resolve) => setTimeout(resolve, 500))
  expect(await request(url).then((res) => res.json())).toMatchObject({clientIdConnects: 1})
})

test('will not reconnect after explicit `close()` in `onError`', async () => {
  const onMessage = getCallCounter({name: 'onMessage'})
  const onError = getCallCounter<ErrorEvent>({name: 'onError', onCall: () => es.close()})
  const clientId = Math.random().toString(36).slice(2)
  const url = `${serverUrl}/identified?client-id=${clientId}&auto-close=true`
  const es = new OurEventSource(url, esInit)
  es.addEventListener('open', () => expect(es.readyState).toBe(OurEventSource.OPEN))
  es.addEventListener('message', onMessage.listener)
  es.addEventListener('error', onError.listener)

  // Should receive a message containing the number of listeners on the given ID
  await onMessage.waitForCallCount(1)
  expect(onMessage.lastArg, 'onMessage `event` argument').toMatchObject({data: '1'})

  await onError.waitForCallCount(1)
  expect(es.readyState, 'readyState').toBe(OurEventSource.CLOSED) // `onDisconnect` called first, closes ES.

  // After 50 ms, we should still be in closing state - no reconnecting
  expect(es.readyState, 'readyState').toBe(OurEventSource.CLOSED)

  // After 500 ms, there should be no clients connected to the given ID
  await new Promise((resolve) => setTimeout(resolve, 500))
  expect(await request(url).then((res) => res.json())).toMatchObject({clientIdConnects: 1})
  expect(es.readyState, 'readyState').toBe(OurEventSource.CLOSED)

  // Wait another 500 ms, just to be sure there are no slow reconnects
  await new Promise((resolve) => setTimeout(resolve, 500))
  expect(await request(url).then((res) => res.json())).toMatchObject({clientIdConnects: 1})
  expect(es.readyState, 'readyState').toBe(OurEventSource.CLOSED)
})

test('will have correct ready state throughout lifecycle', async () => {
  const onMessage = getCallCounter({name: 'onMessage'})
  const onOpen = getCallCounter<Event>({name: 'onOpen'})
  const onError = getCallCounter<ErrorEvent>({name: 'onError'})
  const url = `${serverUrl}/slow-connect`
  const es = new OurEventSource(url, esInit)

  es.addEventListener('message', onMessage.listener)
  es.addEventListener('open', onOpen.listener)
  es.addEventListener('error', onError.listener)

  // Connecting
  expect(es.readyState, 'readyState').toBe(OurEventSource.CONNECTING)

  // Connected
  await onOpen.waitForCallCount(1)
  expect(es.readyState, 'readyState').toBe(OurEventSource.OPEN)

  // Disconnected
  await onError.waitForCallCount(1)
  expect(es.readyState, 'readyState').toBe(OurEventSource.CONNECTING)

  // Closed
  await es.close()
  expect(es.readyState, 'readyState').toBe(OurEventSource.CLOSED)
})

test('will close stream on HTTP 204', async () => {
  const onMessage = getCallCounter({name: 'onMessage'})
  const onError = getCallCounter<ErrorEvent>({name: 'onError'})
  const es = new OurEventSource(`${serverUrl}/end-after-one`, esInit)

  es.addEventListener('progress', onMessage.listener)
  es.addEventListener('error', onError.listener)

  // First disconnect, then reconnect and given a 204
  await onError.waitForCallCount(2)

  // Only the first connect should have given a message
  await onMessage.waitForCallCount(1)

  expect(onMessage.callCount).toBe(1)
  expect(onMessage.lastArg).toMatchObject({
    data: '100%',
    type: 'progress',
    lastEventId: 'prct-100',
  })
  expect(es.readyState, 'readyState').toBe(OurEventSource.CLOSED) // CLOSED

  await deferClose(es)
})

/**
 * Note: Browser behavior varies in what they do on non-string/URL `url`:
 * - Chrome and Safari `toString()`s the value, which is obviously wrong according to spec:
 *   > If urlRecord is failure, then throw a "SyntaxError" DOMException.
 * - Firefox throws a `DOMException` with message `An invalid or illegal string was specified`
 *   (correct according to spec).
 *
 * We choose to go with the spec (eg mirrors Firefox behavior) if `DOMException` exists,
 * otherwise we throw a `SyntaxError`.
 */
test('throws if `url` is not a string/url', () => {
  let thrown: unknown
  try {
    // @ts-expect-error Should be a string or URL
    const es = new OurEventSource(123, esInit)
    es.close()
  } catch (err: unknown) {
    thrown = err
  }

  // Fails with a readable diff rather than a bare "expected to throw" if it did not throw
  expect(thrown).toBeInstanceOf(DOMException)
  expect(thrown).toMatchObject({message: 'An invalid or illegal string was specified'})
})

test('can request cross-origin', async () => {
  const onMessage = getCallCounter({name: 'onMessage'})
  const es = new OurEventSource(new URL(`${crossOriginUrl}/cors`), esInit)
  es.addEventListener('origin', onMessage.listener)

  await onMessage.waitForCallCount(1)
  expect(onMessage.callCount).toBe(1)

  expect(onMessage.lastArg).toMatchObject({type: 'origin'})

  // Browsers send an `Origin` header on cross-origin requests; the server-side runtimes do not
  expect(onMessage.lastArg).toMatchObject({
    data: hasBrowserSemantics ? serverOrigin : '<none>',
  })

  await deferClose(es)
})

// Same-origin redirect tests
;[301, 302, 307, 308].forEach((status) => {
  test(`redirects: handles ${status} to same origin`, async () => {
    const id = Math.random().toString(36).slice(2)
    const onMessage = getCallCounter({name: 'onMessage'})
    const onOpen = getCallCounter<Event>({name: 'onOpen'})
    const url = `${serverUrl}/redirect?status=${status}&id=${id}`
    const es = new OurEventSource(url, {
      ...esInit,
      withCredentials: true,
      fetch(dstUrl, init) {
        return request(dstUrl, {
          ...init,
          headers: {...init?.headers, authorization: 'Bearer foo'},
        })
      },
    })
    es.addEventListener('message', onMessage.listener)
    es.addEventListener('open', onOpen.listener)

    await onMessage.waitForCallCount(1)

    // URL should be the original connected URL, even after redirect
    expect(es.url).toBe(url)

    const firstMessage = onMessage.lastArg
    expect(firstMessage).toMatchObject({origin: serverOrigin})
    expect(JSON.parse(firstMessage.data)).toMatchObject({
      origin: serverOrigin,
      from: url,
      redirects: 1,
      auth: 'Bearer foo',
    })

    // Reconnected and received another message
    await onOpen.waitForCallCount(2)
    await onMessage.waitForCallCount(2)

    const lastMessage = onMessage.lastArg
    expect(lastMessage).toMatchObject({origin: serverOrigin})
    expect(JSON.parse(lastMessage.data)).toMatchObject({
      origin: serverOrigin,
      from: url,
      redirects: 2,
      auth: 'Bearer foo',
    })

    // Deno/Bun seems to set timeStamp to `0` 🤷‍♂️
    if (firstMessage.timeStamp > 0) {
      expect(firstMessage.timeStamp).not.toBe(lastMessage.timeStamp)
    }

    await deferClose(es)
  })
})

// Cross-origin redirect tests
;[301, 302, 307, 308].forEach((status) => {
  xOriginRedirectTest(`redirects: handles ${status} to different origin`, async () => {
    const id = Math.random().toString(36).slice(2)
    const onMessage = getCallCounter({name: 'onMessage'})
    const onOpen = getCallCounter<Event>({name: 'onOpen'})
    const url = `${serverUrl}/redirect?status=${status}&id=${id}&cors=true`
    const es = new OurEventSource(url, {
      ...esInit,
      withCredentials: true,
      fetch(dstUrl, init) {
        return request(dstUrl, {
          ...init,
          headers: {...init?.headers, authorization: 'Bearer foo'},
        })
      },
    })
    es.addEventListener('message', onMessage.listener)
    es.addEventListener('open', onOpen.listener)

    await onMessage.waitForCallCount(1)

    // URL should be the original connected URL, even after redirect
    expect(es.url).toBe(url)

    const firstMessage = onMessage.lastArg
    expect(firstMessage).toMatchObject({origin: crossOrigin})
    expect(JSON.parse(firstMessage.data)).toMatchObject({
      origin: crossOrigin,
      from: url,
      redirects: 1,
      auth: null, // Authorization header should not follow cross-origin redirects
    })

    // Reconnected and received another message
    await onOpen.waitForCallCount(2)
    await onMessage.waitForCallCount(2)

    const lastMessage = onMessage.lastArg
    expect(lastMessage).toMatchObject({origin: crossOrigin})
    expect(JSON.parse(lastMessage.data)).toMatchObject({
      origin: crossOrigin,
      from: url,
      redirects: 2,
      auth: null, // Authorization header should not follow cross-origin redirects
    })

    // Deno/Bun seems to set timeStamp to `0` 🤷‍♂️
    if (firstMessage.timeStamp > 0) {
      expect(firstMessage.timeStamp).not.toBe(lastMessage.timeStamp)
    }

    await deferClose(es)
  })
})

browserTest(
  'can use the `withCredentials` option to control cookies being sent/not sent cross-origin',
  async () => {
    // `withCredentials` only applies to cross-origin requests (per spec)

    // With `withCredentials: true`, cookies should be sent
    let onOpen = getCallCounter<Event>({name: 'onOpen'})
    let es = new OurEventSource(`${crossOriginUrl}/authed`, {
      ...esInit,
      withCredentials: true,
      fetch(url, init) {
        expect(init).toMatchObject({credentials: 'include'})
        return request(url, init)
      },
    })

    es.addEventListener('open', onOpen.listener)
    await onOpen.waitForCallCount(1)
    await deferClose(es)

    // With `withCredentials: false`, no cookies should be sent
    es = new OurEventSource(`${crossOriginUrl}/authed`, {
      ...esInit,
      withCredentials: false,
      fetch(url, init) {
        expect(init).toMatchObject({credentials: 'same-origin'})
        return request(url, init)
      },
    })
    onOpen = getCallCounter<Event>({name: 'onOpen'})
    es.addEventListener('open', onOpen.listener)

    await onOpen.waitForCallCount(1)
    await deferClose(es)

    // With `withCredentials: undefined`, no cookies should be sent
    es = new OurEventSource(`${crossOriginUrl}/authed`, esInit)
    onOpen = getCallCounter<Event>({name: 'onOpen'})
    es.addEventListener('open', onOpen.listener)

    await onOpen.waitForCallCount(1)
    await deferClose(es)
  },
)

test('throws on `fetch()` that does not return web-stream', async () => {
  const url = `${serverUrl}/`

  // @ts-expect-error `body` should be a ReadableStream
  const faultyFetch: FetchLike = async () => ({
    body: 'not a stream',
    redirected: false,
    status: 200,
    headers: new Headers({'content-type': 'text/event-stream'}),
    url,
  })

  const onError = getCallCounter<ErrorEvent>({name: 'onError'})
  const es = new OurEventSource(url, {fetch: faultyFetch})

  es.addEventListener('error', onError.listener)
  await onError.waitForCallCount(1)

  expect(onError.lastArg).toMatchObject({
    type: 'error',
    defaultPrevented: false,
    cancelable: false,
    timeStamp: expect.any(Number),
    message: 'Invalid response body, expected a web ReadableStream',
    code: 200,
  })
  await deferClose(es)
})

test('throws on `fetch()` that does not return a body', async () => {
  const url = `${serverUrl}/`

  // @ts-expect-error `body` should be a ReadableStream
  const faultyFetch: FetchLike = async () => ({
    redirected: false,
    status: 200,
    headers: new Headers({'content-type': 'text/event-stream'}),
    url,
  })

  const onError = getCallCounter<ErrorEvent>({name: 'onError'})
  const es = new OurEventSource(url, {fetch: faultyFetch})

  es.addEventListener('error', onError.listener)
  await onError.waitForCallCount(1)

  expect(onError.lastArg).toMatchObject({
    type: 'error',
    defaultPrevented: false,
    cancelable: false,
    timeStamp: expect.any(Number),
    message: 'Invalid response body, expected a web ReadableStream',
    code: 200,
  })
  await deferClose(es)
})

test('throws on `fetch()` yielding chunks that are not buffers', async () => {
  const url = `${serverUrl}/`

  // @ts-expect-error `value` should be a buffer, which is all a `TextDecoder` accepts
  const faultyFetch: FetchLike = async () => ({
    body: {
      getReader: () => ({
        read: async () => ({done: false, value: 'not a buffer'}),
        cancel: async () => {},
      }),
    },
    redirected: false,
    status: 200,
    headers: new Headers({'content-type': 'text/event-stream'}),
    url,
  })

  const onError = getCallCounter<ErrorEvent>({name: 'onError'})
  const es = new OurEventSource(url, {fetch: faultyFetch})

  es.addEventListener('error', onError.listener)
  await onError.waitForCallCount(1)

  // The message comes from the runtime's `TextDecoder`, and differs between environments
  expect(onError.lastArg).toMatchObject({type: 'error'})
  await deferClose(es)
})

test('[NON-SPEC] message event contains extended properties (failed connection)', async () => {
  const onError = getCallCounter<ErrorEvent>({name: 'onError'})
  const es = new OurEventSource(`http://127.0.0.1:9999/should-not-connect`, esInit)

  es.addEventListener('error', onError.listener)
  await onError.waitForCallCount(1)

  expect(onError.lastArg).toMatchObject({
    type: 'error',
    defaultPrevented: false,
    cancelable: false,
    timeStamp: expect.any(Number),
    // Node, Deno, Bun, Chromium, Webkit, Firefox _ALL_ have different messages 😅
    message: expect.stringMatching(
      /fetch failed|failed to fetch|load failed|attempting to fetch|connection refused|ECONNREFUSED|unable to connect|network connection lost/i,
    ),
    code: undefined,
  })
  await deferClose(es)
})

test('[NON-SPEC] message event contains extended properties (invalid http response)', async () => {
  const onError = getCallCounter<ErrorEvent>({name: 'onError'})
  const es = new OurEventSource(`${serverUrl}/end-after-one`, esInit)

  es.addEventListener('error', onError.listener)
  await onError.waitForCallCount(2)

  expect(onError.lastArg).toMatchObject({
    type: 'error',
    defaultPrevented: false,
    cancelable: false,
    timeStamp: expect.any(Number),
    message: 'Server sent HTTP 204, not reconnecting',
    code: 204,
  })
  await deferClose(es)
})

test('[NON-SPEC] custom `maxBufferSize` fails connection on parser buffer overflow', async () => {
  const url = `${serverUrl}/`
  let fetchCount = 0

  const faultyFetch: FetchLike = async () => {
    fetchCount++
    return {
      body: new ReadableStream<Uint8Array>({
        start(controller) {
          const encoder = new TextEncoder()
          controller.enqueue(encoder.encode('retry: 10\n'))
          controller.enqueue(encoder.encode(`data: ${'x'.repeat(32)}\n`))
          controller.close()
        },
      }),
      redirected: false,
      status: 200,
      headers: new Headers({'content-type': 'text/event-stream'}),
      url,
    }
  }

  const onError = getCallCounter<ErrorEvent>({name: 'onError'})
  const es = new OurEventSource(url, {fetch: faultyFetch, maxBufferSize: 16})

  es.addEventListener('error', onError.listener)
  await onError.waitForCallCount(1)

  expect(onError.lastArg).toMatchObject({
    type: 'error',
    defaultPrevented: false,
    cancelable: false,
    timeStamp: expect.any(Number),
    message: expect.stringMatching(/Buffered data exceeded max buffer size/),
    code: undefined,
  })
  expect(es.readyState, 'readyState').toBe(OurEventSource.CLOSED)

  await new Promise((resolve) => setTimeout(resolve, 50))
  expect(fetchCount).toBe(1)
  await deferClose(es)
})

test('[NON-SPEC] unrefs the reconnection timer where supported, so it does not keep the event loop alive', async () => {
  // Browsers return numeric timer handles, so there is nothing to unref there.
  const probe = setTimeout(() => {}, 0)
  const supportsUnref = typeof probe === 'object' && probe !== null && 'unref' in probe
  clearTimeout(probe)
  if (!supportsUnref) {
    return
  }

  // `/counter` sends `retry: 50`, then disconnects after 3 messages - so the reconnection
  // timer is scheduled with a 50ms delay. Capture those specific timers and track whether
  // `unref()` was called on them.
  const reconnectTimers: Array<{unrefCalled: boolean}> = []
  const realSetTimeout = globalThis.setTimeout
  const setTimeoutStub = (
    callback: (...args: unknown[]) => void,
    ms?: number,
    ...rest: unknown[]
  ) => {
    const handle = realSetTimeout(callback, ms, ...rest)
    if (ms === 50 && typeof handle === 'object' && handle !== null && 'unref' in handle) {
      const record = {unrefCalled: false}
      reconnectTimers.push(record)
      const realUnref = handle.unref.bind(handle)
      handle.unref = () => {
        record.unrefCalled = true
        return realUnref()
      }
    }
    return handle
  }
  vi.stubGlobal('setTimeout', setTimeoutStub)

  try {
    const onError = getCallCounter<ErrorEvent>({name: 'onError'})
    const es = new OurEventSource(`${serverUrl}/counter`, esInit)
    es.addEventListener('error', onError.listener)

    // Wait for the disconnect, which schedules the reconnection timer.
    await onError.waitForCallCount(1)

    expect(reconnectTimers.length > 0, 'a reconnection timer was scheduled').toBe(true)
    expect(
      reconnectTimers.every((timer) => timer.unrefCalled),
      'reconnection timer was unref-ed',
    ).toBe(true)

    es.close()
  } finally {
    vi.unstubAllGlobals()
  }
})

test('has CONNECTING constant', async () => {
  const es = new OurEventSource(`${serverUrl}/`)
  expect(es.readyState).toBe(OurEventSource.CONNECTING)
  expect(es.CONNECTING).toBe(0)
  expect(OurEventSource.CONNECTING).toBe(0)
  await deferClose(es)
})

test('has OPEN constant', async () => {
  const onOpen = getCallCounter<Event>({name: 'onOpen'})
  const es = new OurEventSource(`${serverUrl}/`)
  es.onopen = onOpen.listener
  await onOpen.waitForCallCount(1)
  expect(es.readyState).toBe(OurEventSource.OPEN)
  expect(es.OPEN).toBe(1)
  expect(OurEventSource.OPEN).toBe(1)
  await deferClose(es)
})

test('has CLOSED constant', async () => {
  const es = new OurEventSource(`${serverUrl}/`)
  es.close()
  expect(es.readyState).toBe(OurEventSource.CLOSED)
  expect(es.CLOSED).toBe(2)
  expect(OurEventSource.CLOSED).toBe(2)
  await deferClose(es)
})

test('has non-enumarable `eventsource.supports-fetch-override` symbol', () => {
  const supportsFetchOverride = Symbol.for('eventsource.supports-fetch-override')
  expect(Object.getOwnPropertySymbols(OurEventSource).includes(supportsFetchOverride)).toBe(true)
  expect(Object.keys(OurEventSource).includes('supports-fetch-override')).toBe(false)
  expect(supportsFetchOverride in OurEventSource).toBe(true)
})

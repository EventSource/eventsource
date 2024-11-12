import {EventSource as OurEventSource, type FetchLike, type FetchLikeInit} from '../src/index.js'
import {unicodeLines} from './fixtures.js'
import {deferClose, expect, getCallCounter} from './helpers.js'
import type {TestRunner} from './waffletest/index.js'

export function registerTests(options: {
  environment: string
  runner: TestRunner
  port: number
  fetch?: typeof fetch
}): TestRunner {
  const {port, fetch, runner, environment} = options

  // eslint-disable-next-line no-empty-function
  const browserTest = environment === 'browser' ? runner.registerTest : function noop() {}
  const test = runner.registerTest

  const baseUrl =
    typeof document === 'undefined'
      ? 'http://127.0.0.1'
      : `${location.protocol}//${location.hostname}`

  test('can connect, receive message, manually disconnect', async () => {
    const onMessage = getCallCounter({name: 'onMessage'})
    const es = new OurEventSource(new URL(`${baseUrl}:${port}/`))
    es.addEventListener('welcome', onMessage, false)

    await onMessage.waitForCallCount(1)

    expect(onMessage.callCount).toBe(1)
    expect(onMessage.lastCall.lastArg).toMatchObject({
      data: 'Hello, world!',
      origin: `${baseUrl}:${port}`,
    })

    await deferClose(es)
  })

  test('can connect using URL string only', async () => {
    const es = new OurEventSource(`${baseUrl}:${port}/`)
    const onMessage = getCallCounter({name: 'onMessage'})
    es.addEventListener('welcome', onMessage, false)

    await onMessage.waitForCallCount(1)
    await deferClose(es)
  })

  test('passes `no-store` to `fetch`, avoiding cache', async () => {
    let passedInit: FetchLikeInit | undefined

    const onMessage = getCallCounter({name: 'onMessage'})
    const es = new OurEventSource(new URL(`${baseUrl}:${port}/debug`), {
      fetch: (url, init) => {
        passedInit = init
        return (fetch || globalThis.fetch)(url, init)
      },
    })

    es.addEventListener('debug', onMessage, false)
    await onMessage.waitForCallCount(1)

    expect(passedInit).toMatchObject({cache: 'no-store'})
    await deferClose(es)
  })

  test('can handle unicode data correctly', async () => {
    const onMessage = getCallCounter({name: 'onMessage'})
    const es = new OurEventSource(`${baseUrl}:${port}/unicode`, {fetch})

    const messages: Array<{data: string}> = []
    es.addEventListener('unicode', (evt) => {
      messages.push(evt)
      onMessage()
    })

    await onMessage.waitForCallCount(2)
    expect(messages[0].data).toBe(unicodeLines[0])
    expect(messages[1].data).toBe(unicodeLines[1])

    await deferClose(es)
  })

  test('can use `es.onopen` to listen for open events, nulling it unsubscribes', async () => {
    const onError = getCallCounter({name: 'onError'})
    const onOpen = getCallCounter({name: 'onOpen'})
    const es = new OurEventSource(`${baseUrl}:${port}/counter`, {fetch})
    es.addEventListener('error', onError)
    es.onopen = onOpen

    await onOpen.waitForCallCount(2)
    es.onopen = null

    await onError.waitForCallCount(4) // 4 disconnects

    // If `es.onopen = null` did not work, this should be 4
    expect(onOpen.callCount).toBe(2)
    await deferClose(es)
  })

  test('can use `es.onerror` to listen for error events, nulling it unsubscribes', async () => {
    const onError = getCallCounter({name: 'onError'})
    const onOpen = getCallCounter({name: 'onOpen'})
    const es = new OurEventSource(`${baseUrl}:${port}/counter`, {fetch})
    es.addEventListener('open', onOpen)
    es.onerror = onError

    await onOpen.waitForCallCount(3)
    es.onerror = null

    await onOpen.waitForCallCount(4) // 4 connects

    // If `es.onerror = null` did not work, this should be 4
    expect(onError.callCount).toBe(2)
    await deferClose(es)
  })

  test('can use `es.onmessage` to listen for explicit `message` events, nulling it unsubscribes', async () => {
    const onMessage = getCallCounter({name: 'onMessage'})
    const onError = getCallCounter({name: 'onError'})
    const es = new OurEventSource(`${baseUrl}:${port}/counter?event=message`, {fetch})
    es.addEventListener('error', onError)
    es.onmessage = onMessage

    await onError.waitForCallCount(2)
    es.onmessage = null

    await onError.waitForCallCount(3) // 3 disconnects

    // If `es.onmessage = null` did not work, this should be 9,
    // since each connect emits 3 message then closes
    expect(onMessage.callCount).toBe(6)
    await deferClose(es)
  })

  test('can use `es.onmessage` to listen for implicit `message` events, nulling it unsubscribes', async () => {
    const onMessage = getCallCounter({name: 'onMessage'})
    const onError = getCallCounter({name: 'onError'})
    const es = new OurEventSource(`${baseUrl}:${port}/counter?event=`, {fetch})
    es.addEventListener('error', onError)
    es.onmessage = onMessage

    await onError.waitForCallCount(2)
    es.onmessage = null

    await onError.waitForCallCount(3) // 3 disconnects

    // If `es.onmessage = null` did not work, this should be 9,
    // since each connect emits 3 message then closes
    expect(onMessage.callCount).toBe(6)
    await deferClose(es)
  })

  test('`es.onmessage` does not fire for non-`message` events', async () => {
    const onMessage = getCallCounter({name: 'onMessage'})
    const onOpen = getCallCounter({name: 'onOpen'})
    const es = new OurEventSource(`${baseUrl}:${port}/counter`, {fetch})
    es.addEventListener('open', onOpen)
    es.onmessage = onMessage

    await onOpen.waitForCallCount(3)
    es.onmessage = null

    // `event` was never "message" (or blank), only ever `counter`
    expect(onMessage.callCount).toBe(0)
    await deferClose(es)
  })

  test('`es.onmessage` does not fire for non-`message` events', async () => {
    const onMessage = getCallCounter({name: 'onMessage'})
    const onOpen = getCallCounter({name: 'onOpen'})
    const es = new OurEventSource(`${baseUrl}:${port}/counter`, {fetch})
    es.addEventListener('open', onOpen)
    es.onmessage = onMessage

    await onOpen.waitForCallCount(3)
    es.onmessage = null

    // `event` was never "message" (or blank), only ever `counter`
    expect(onMessage.callCount).toBe(0)
    await deferClose(es)
  })

  test('can redeclare `es.onopen` after initial assignment', async () => {
    const onError = getCallCounter({name: 'onError'})
    const onOpen = getCallCounter({name: 'onOpen'})
    const onOpenNew = getCallCounter({name: 'onOpen (new)'})
    const es = new OurEventSource(`${baseUrl}:${port}/counter`, {fetch})
    es.addEventListener('error', onError)
    es.onopen = onOpen

    await onOpen.waitForCallCount(2)
    es.onopen = onOpenNew

    await onError.waitForCallCount(4) // 4 disconnects

    // If `es.onopen = <new-fn>` did not work, this should be 4
    expect(onOpen.callCount).toBe(2)
    expect(onOpenNew.callCount).toBe(2)
    await deferClose(es)
  })

  test('can redeclare `es.onerror` after initial assignment', async () => {
    const onError = getCallCounter({name: 'onError'})
    const onErrorNew = getCallCounter({name: 'onError (new)'})
    const onOpen = getCallCounter({name: 'onOpen'})
    const es = new OurEventSource(`${baseUrl}:${port}/counter`, {fetch})
    es.addEventListener('open', onOpen)
    es.onerror = onError

    await onOpen.waitForCallCount(3)
    es.onerror = onErrorNew

    await onOpen.waitForCallCount(4) // 4 connects

    // If `es.onerror = <new-fn>` did not work, this should be 4
    expect(onError.callCount).toBe(2)
    expect(onErrorNew.callCount).toBe(1)
    await deferClose(es)
  })

  test('can redeclare `es.onmessage` after initial assignment', async () => {
    const onMessage = getCallCounter({name: 'onMessage'})
    const onMessageNew = getCallCounter({name: 'onMessage (new)'})
    const onError = getCallCounter({name: 'onError'})
    const es = new OurEventSource(`${baseUrl}:${port}/counter?event=message`, {fetch})
    es.addEventListener('error', onError)
    es.onmessage = onMessage

    await onError.waitForCallCount(2)
    es.onmessage = onMessageNew

    await onError.waitForCallCount(3) // 3 disconnects

    // If `es.onmessage = <new-fn>` did not work, this should be 9,
    // since each connect emits 3 message then closes
    expect(onMessage.callCount).toBe(6)
    expect(onMessageNew.callCount).toBe(3)
    await deferClose(es)
  })

  test('message event contains correct properties', async () => {
    const onMessage = getCallCounter({name: 'onMessage'})
    const es = new OurEventSource(`${baseUrl}:${port}/counter`, {fetch})

    es.addEventListener('counter', onMessage)
    await onMessage.waitForCallCount(1)

    expect(onMessage.lastCall.lastArg).toMatchObject({
      data: 'Counter is at 1',
      type: 'counter',
      lastEventId: '1',
      origin: `${baseUrl}:${port}`,
      defaultPrevented: false,
      cancelable: false,
      timeStamp: expect.any('number'),
    })
    await deferClose(es)
  })

  test('will reconnect with last received message id if server disconnects', async () => {
    const onMessage = getCallCounter({name: 'onMessage'})
    const onError = getCallCounter({name: 'onError'})
    const url = `${baseUrl}:${port}/counter`
    const es = new OurEventSource(url, {fetch})
    es.addEventListener('counter', onMessage)
    es.addEventListener('error', onError)

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
    expect(onMessage.lastCall.lastArg).toMatchObject({
      data: 'Counter is at 8',
      type: 'counter',
      lastEventId: '8',
      origin: `${baseUrl}:${port}`,
    })
    expect(onMessage.callCount).toBe(8)

    await deferClose(es)
  })

  test('will not reconnect after explicit `close()`', async () => {
    const request = fetch || globalThis.fetch
    const onMessage = getCallCounter({name: 'onMessage'})
    const onError = getCallCounter({name: 'onError'})
    const clientId = Math.random().toString(36).slice(2)
    const url = `${baseUrl}:${port}/identified?client-id=${clientId}`
    const es = new OurEventSource(url, {fetch})

    es.addEventListener('message', onMessage)
    es.addEventListener('error', onError)

    // Should receive a message containing the number of listeners on the given ID
    await onMessage.waitForCallCount(1)
    expect(onMessage.lastCall.lastArg).toMatchObject({data: '1'})
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
    const request = fetch || globalThis.fetch
    const onMessage = getCallCounter({name: 'onMessage'})
    const onError = getCallCounter({name: 'onError', onCall: () => es.close()})
    const clientId = Math.random().toString(36).slice(2)
    const url = `${baseUrl}:${port}/identified?client-id=${clientId}&auto-close=true`
    const es = new OurEventSource(url, {fetch})
    es.addEventListener('open', () => expect(es.readyState).toBe(OurEventSource.OPEN))
    es.addEventListener('message', onMessage)
    es.addEventListener('error', onError)

    // Should receive a message containing the number of listeners on the given ID
    await onMessage.waitForCallCount(1)
    expect(onMessage.lastCall.lastArg, 'onMessage `event` argument').toMatchObject({data: '1'})

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
    const onOpen = getCallCounter({name: 'onOpen'})
    const onError = getCallCounter({name: 'onError'})
    const url = `${baseUrl}:${port}/slow-connect`
    const es = new OurEventSource(url, {fetch})

    es.addEventListener('message', onMessage)
    es.addEventListener('open', onOpen)
    es.addEventListener('error', onError)

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
    const onError = getCallCounter({name: 'onError'})
    const es = new OurEventSource(`${baseUrl}:${port}/end-after-one`, {fetch})

    es.addEventListener('progress', onMessage)
    es.addEventListener('error', onError)

    // First disconnect, then reconnect and given a 204
    await onError.waitForCallCount(2)

    // Only the first connect should have given a message
    await onMessage.waitForCallCount(1)

    expect(onMessage.callCount).toBe(1)
    expect(onMessage.lastCall.lastArg).toMatchObject({
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
    const onMessage = getCallCounter({name: 'onMessage'})
    try {
      // @ts-expect-error Should be a string or URL
      const es = new OurEventSource(123, {fetch})
      es.addEventListener('message', onMessage)
      es.close()
    } catch (err) {
      expect(err instanceof DOMException).toBe(true)
      expect(err.message).toBe('An invalid or illegal string was specified')
      return
    }

    throw new Error('Expected invalid URL to throw')
  })

  test('can request cross-origin', async () => {
    const hostUrl = new URL(`${baseUrl}:${port}/cors`)
    const url = new URL(hostUrl)
    url.hostname = url.hostname === 'localhost' ? '127.0.0.1' : 'localhost'

    const onMessage = getCallCounter({name: 'onMessage'})
    const es = new OurEventSource(url, {fetch})
    es.addEventListener('origin', onMessage)

    await onMessage.waitForCallCount(1)
    expect(onMessage.callCount).toBe(1)

    const lastMessage = onMessage.lastCall.lastArg
    expect(lastMessage).toMatchObject({type: 'origin'})

    if (environment === 'browser') {
      expect(lastMessage).toMatchObject({data: hostUrl.origin})
    } else {
      expect(lastMessage).toMatchObject({data: '<none>'})
    }

    await deferClose(es)
  })

  // Same-origin redirect tests
  ;[301, 302, 307, 308].forEach((status) => {
    test(`redirects: handles ${status} to same origin`, async () => {
      const request = fetch || globalThis.fetch
      const id = Math.random().toString(36).slice(2)
      const onMessage = getCallCounter({name: 'onMessage'})
      const onOpen = getCallCounter({name: 'onOpen'})
      const origin = `${baseUrl}:${port}`
      const url = `${origin}/redirect?status=${status}&id=${id}`
      const es = new OurEventSource(url, {
        withCredentials: true,
        fetch(dstUrl, init) {
          return request(dstUrl, {
            ...init,
            headers: {...init?.headers, authorization: 'Bearer foo'},
          })
        },
      })
      es.addEventListener('message', onMessage)
      es.addEventListener('open', onOpen)

      await onMessage.waitForCallCount(1)

      // URL should be the original connected URL, even after redirect
      expect(es.url).toBe(url)

      const firstMessage = onMessage.lastCall.lastArg
      expect(firstMessage).toMatchObject({origin})
      expect(JSON.parse(firstMessage.data)).toMatchObject({
        origin,
        from: url,
        redirects: 1,
        auth: 'Bearer foo',
      })

      // Reconnected and received another message
      await onOpen.waitForCallCount(2)
      await onMessage.waitForCallCount(2)

      const lastMessage = onMessage.lastCall.lastArg
      expect(lastMessage).toMatchObject({origin})
      expect(JSON.parse(lastMessage.data)).toMatchObject({
        origin,
        from: url,
        redirects: 2,
        auth: 'Bearer foo',
      })

      expect(firstMessage.timeStamp).notToBe(lastMessage.timeStamp)

      await deferClose(es)
    })
  })

  // Cross-origin redirect tests
  ;[301, 302, 307, 308].forEach((status) => {
    test(`redirects: handles ${status} to different origin`, async () => {
      const request = fetch || globalThis.fetch
      const id = Math.random().toString(36).slice(2)
      const onMessage = getCallCounter({name: 'onMessage'})
      const onOpen = getCallCounter({name: 'onOpen'})
      const origin = `${baseUrl}:${port}`
      const corsOrigin = baseUrl.includes('localhost')
        ? `http://127.0.0.1:${port}`
        : `http://localhost:${port}`
      const url = `${origin}/redirect?status=${status}&id=${id}&cors=true`
      const es = new OurEventSource(url, {
        withCredentials: true,
        fetch(dstUrl, init) {
          return request(dstUrl, {
            ...init,
            headers: {...init?.headers, authorization: 'Bearer foo'},
          })
        },
      })
      es.addEventListener('message', onMessage)
      es.addEventListener('open', onOpen)

      await onMessage.waitForCallCount(1)

      // URL should be the original connected URL, even after redirect
      expect(es.url).toBe(url)

      const firstMessage = onMessage.lastCall.lastArg
      expect(firstMessage).toMatchObject({origin: corsOrigin})
      expect(JSON.parse(firstMessage.data)).toMatchObject({
        origin: corsOrigin,
        from: url,
        redirects: 1,
        auth: null, // Authorization header should not follow cross-origin redirects
      })

      // Reconnected and received another message
      await onOpen.waitForCallCount(2)
      await onMessage.waitForCallCount(2)

      const lastMessage = onMessage.lastCall.lastArg
      expect(lastMessage).toMatchObject({origin: corsOrigin})
      expect(JSON.parse(lastMessage.data)).toMatchObject({
        origin: corsOrigin,
        from: url,
        redirects: 2,
        auth: null, // Authorization header should not follow cross-origin redirects
      })

      expect(firstMessage.timeStamp).notToBe(lastMessage.timeStamp)

      await deferClose(es)
    })
  })

  browserTest(
    'can use the `withCredentials` option to control cookies being sent/not sent cross-origin',
    async () => {
      const request = fetch || globalThis.fetch

      // `withCredentials` only applies to cross-origin requests (per spec)
      const corsOrigin = baseUrl.includes('localhost')
        ? `http://127.0.0.1:${port}`
        : `http://localhost:${port}`

      // With `withCredentials: true`, cookies should be sent
      let onOpen = getCallCounter({name: 'onOpen'})
      let es = new OurEventSource(`${corsOrigin}/authed`, {
        withCredentials: true,
        fetch(url, init) {
          expect(init).toMatchObject({credentials: 'include'})
          return request(url, init)
        },
      })

      es.addEventListener('open', onOpen)
      await onOpen.waitForCallCount(1)
      await deferClose(es)

      // With `withCredentials: false`, no cookies should be sent
      es = new OurEventSource(`${corsOrigin}/authed`, {
        withCredentials: false,
        fetch(url, init) {
          expect(init).toMatchObject({credentials: 'same-origin'})
          return request(url, init)
        },
      })
      onOpen = getCallCounter({name: 'onOpen'})
      es.addEventListener('open', onOpen)

      await onOpen.waitForCallCount(1)
      await deferClose(es)

      // With `withCredentials: undefined`, no cookies should be sent
      es = new OurEventSource(`${corsOrigin}/authed`, {fetch})
      onOpen = getCallCounter({name: 'onOpen'})
      es.addEventListener('open', onOpen)

      await onOpen.waitForCallCount(1)
      await deferClose(es)
    },
  )

  test('throws on `fetch()` that does not return web-stream', async () => {
    const url = `${baseUrl}:${port}/`

    // @ts-expect-error `body` should be a ReadableStream
    const faultyFetch: FetchLike = async () => ({
      body: 'not a stream',
      redirected: false,
      status: 200,
      headers: new Headers({'content-type': 'text/event-stream'}),
      url,
    })

    const onError = getCallCounter({name: 'onError'})
    const es = new OurEventSource(url, {fetch: faultyFetch})

    es.addEventListener('error', onError)
    await onError.waitForCallCount(1)

    expect(onError.lastCall.lastArg).toMatchObject({
      type: 'error',
      defaultPrevented: false,
      cancelable: false,
      timeStamp: expect.any('number'),
      message: 'Invalid response body, expected a web ReadableStream',
      code: 200,
    })
    await deferClose(es)
  })

  test('throws on `fetch()` that does not return a body', async () => {
    const url = `${baseUrl}:${port}/`

    // @ts-expect-error `body` should be a ReadableStream
    const faultyFetch: FetchLike = async () => ({
      redirected: false,
      status: 200,
      headers: new Headers({'content-type': 'text/event-stream'}),
      url,
    })

    const onError = getCallCounter({name: 'onError'})
    const es = new OurEventSource(url, {fetch: faultyFetch})

    es.addEventListener('error', onError)
    await onError.waitForCallCount(1)

    expect(onError.lastCall.lastArg).toMatchObject({
      type: 'error',
      defaultPrevented: false,
      cancelable: false,
      timeStamp: expect.any('number'),
      message: 'Invalid response body, expected a web ReadableStream',
      code: 200,
    })
    await deferClose(es)
  })

  test('[NON-SPEC] message event contains extended properties', async () => {
    const onError = getCallCounter({name: 'onError'})
    const es = new OurEventSource(`${baseUrl}:${port}/end-after-one`, {fetch})

    es.addEventListener('error', onError)
    await onError.waitForCallCount(2)

    expect(onError.lastCall.lastArg).toMatchObject({
      type: 'error',
      defaultPrevented: false,
      cancelable: false,
      timeStamp: expect.any('number'),
      message: 'Server sent HTTP 204, not reconnecting',
      code: 204,
    })
    await deferClose(es)
  })

  test('has CONNECTING constant', () => {
    const es = new OurEventSource(`${baseUrl}:${port}/`)
    expect(es.readyState).toBe(OurEventSource.CONNECTING)
    expect(es.CONNECTING).toBe(0)
    expect(OurEventSource.CONNECTING).toBe(0)
    es.close()
  })

  test('has OPEN constant', async () => {
    const onOpen = getCallCounter({name: 'onOpen'})
    const es = new OurEventSource(`${baseUrl}:${port}/`)
    es.onopen = onOpen
    await onOpen.waitForCallCount(1)
    expect(es.readyState).toBe(OurEventSource.OPEN)
    expect(es.OPEN).toBe(1)
    expect(OurEventSource.OPEN).toBe(1)
    es.close()
  })

  test('has CLOSED constant', () => {
    const es = new OurEventSource(`${baseUrl}:${port}/`)
    es.close()
    expect(es.readyState).toBe(OurEventSource.CLOSED)
    expect(es.CLOSED).toBe(2)
    expect(OurEventSource.CLOSED).toBe(2)
  })

  return runner
}

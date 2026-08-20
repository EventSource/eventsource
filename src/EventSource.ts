import {
  createParser,
  type EventSourceMessage,
  type EventSourceParser,
  type ParseError,
} from 'eventsource-parser'

import {ErrorEvent, flattenError, syntaxError} from './errors.ts'
import type {
  AddEventListenerOptions,
  EventListenerOptions,
  EventListenerOrEventListenerObject,
  EventSourceEventMap,
  EventSourceFetchInit,
  EventSourceInit,
  FetchLike,
  FetchLikeResponse,
} from './types.ts'

const DEFAULT_MAX_BUFFER_SIZE = 100 * 1024 * 1024

/**
 * An `EventSource` instance opens a persistent connection to an HTTP server, which sends events
 * in `text/event-stream` format. The connection remains open until closed by calling `.close()`.
 *
 * Deliberately an `interface` and not a `class`: it lets consumers pass the native `EventSource`,
 * a mock, or any other implementation wherever this type is expected.
 *
 * @public
 * @example
 * ```js
 * const eventSource = new EventSource('https://example.com/stream')
 * eventSource.addEventListener('error', (error) => {
 *   console.error(error)
 * })
 * eventSource.addEventListener('message', (event) => {
 *  console.log('Received message:', event.data)
 * })
 * ```
 */
export interface EventSource extends EventTarget {
  /**
   * ReadyState representing an EventSource currently trying to connect
   *
   * @public
   */
  readonly CONNECTING: 0

  /**
   * ReadyState representing an EventSource connection that is open (eg connected)
   *
   * @public
   */
  readonly OPEN: 1

  /**
   * ReadyState representing an EventSource connection that is closed (eg disconnected)
   *
   * @public
   */
  readonly CLOSED: 2

  /**
   * Returns the state of this EventSource object's connection. It can have the values described below.
   *
   * [MDN Reference](https://developer.mozilla.org/docs/Web/API/EventSource/readyState)
   *
   * Note: typed as `number` instead of `0 | 1 | 2` for compatibility with the `EventSource` interface,
   * defined in the TypeScript `dom` library.
   *
   * @public
   */
  readonly readyState: number

  /**
   * Returns the URL providing the event stream.
   *
   * [MDN Reference](https://developer.mozilla.org/docs/Web/API/EventSource/url)
   *
   * @public
   */
  readonly url: string

  /**
   * Returns true if the credentials mode for connection requests to the URL providing the event stream is set to "include", and false otherwise.
   *
   * [MDN Reference](https://developer.mozilla.org/docs/Web/API/EventSource/withCredentials)
   *
   * @public
   */
  readonly withCredentials: boolean

  /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/EventSource/error_event) */
  onerror: ((this: EventSource, ev: ErrorEvent) => unknown) | null

  /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/EventSource/message_event) */
  onmessage: ((this: EventSource, ev: MessageEvent) => unknown) | null

  /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/EventSource/open_event) */
  onopen: ((this: EventSource, ev: Event) => unknown) | null

  addEventListener<K extends keyof EventSourceEventMap>(
    type: K,
    listener: (this: EventSource, ev: EventSourceEventMap[K]) => unknown,
    options?: boolean | AddEventListenerOptions,
  ): void
  addEventListener(
    type: string,
    listener: (this: EventSource, event: MessageEvent) => unknown,
    options?: boolean | AddEventListenerOptions,
  ): void
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ): void

  removeEventListener<K extends keyof EventSourceEventMap>(
    type: K,
    listener: (this: EventSource, ev: EventSourceEventMap[K]) => unknown,
    options?: boolean | EventListenerOptions,
  ): void
  removeEventListener(
    type: string,
    listener: (this: EventSource, event: MessageEvent) => unknown,
    options?: boolean | EventListenerOptions,
  ): void
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions,
  ): void

  /**
   * Aborts any instances of the fetch algorithm started for this EventSource object, and sets the readyState attribute to CLOSED.
   *
   * [MDN Reference](https://developer.mozilla.org/docs/Web/API/EventSource/close)
   *
   * @public
   */
  close(): void
}

/**
 * The `EventSource` constructor. Mirrors the shape of the native one, so the two can be used
 * interchangeably - eg for functions that take an implementation to construct.
 *
 * @public
 */
export interface EventSourceConstructor {
  readonly prototype: EventSource

  /**
   * Constructs a new `EventSource` instance, which immediately starts connecting.
   *
   * @param url - The URL to connect to
   * @param eventSourceInitDict - Options for the connection
   */
  new (url: string | URL, eventSourceInitDict?: EventSourceInit): EventSource

  /** ReadyState representing an EventSource currently trying to connect */
  readonly CONNECTING: 0

  /** ReadyState representing an EventSource connection that is open (eg connected) */
  readonly OPEN: 1

  /** ReadyState representing an EventSource connection that is closed (eg disconnected) */
  readonly CLOSED: 2
}

/**
 * Implementation of the `EventSource` interface.
 *
 * Intentionally not exported: TypeScript emits a `#private` brand into declaration files for any
 * class holding hard-private (`#`) fields, which makes the emitted type nominal. Exporting the
 * interface and const instead keeps the public type structural, while the implementation keeps
 * its actual, runtime-enforced private state.
 *
 * Public members are documented on the `EventSource` interface, which is what consumers see.
 *
 * @internal
 */
class EventSourceImpl extends EventTarget implements EventSource {
  static CONNECTING = 0 as const
  static OPEN = 1 as const
  static CLOSED = 2 as const

  readonly CONNECTING = 0 as const
  readonly OPEN = 1 as const
  readonly CLOSED = 2 as const

  public get readyState(): number {
    return this.#readyState
  }

  public get url(): string {
    return this.#url.href
  }

  public get withCredentials(): boolean {
    return this.#withCredentials
  }

  public get onerror(): ((this: EventSource, ev: ErrorEvent) => unknown) | null {
    return this.#onError
  }
  public set onerror(value: ((this: EventSource, ev: ErrorEvent) => unknown) | null) {
    if (this.#onError) {
      this.removeEventListener('error', this.#onError)
    }
    this.#onError = value
    if (value) {
      this.addEventListener('error', value)
    }
  }

  public get onmessage(): ((this: EventSource, ev: MessageEvent) => unknown) | null {
    return this.#onMessage
  }
  public set onmessage(value: ((this: EventSource, ev: MessageEvent) => unknown) | null) {
    if (this.#onMessage) {
      this.removeEventListener('message', this.#onMessage)
    }
    this.#onMessage = value
    if (value) {
      this.addEventListener('message', value)
    }
  }

  public get onopen(): ((this: EventSource, ev: Event) => unknown) | null {
    return this.#onOpen
  }
  public set onopen(value: ((this: EventSource, ev: Event) => unknown) | null) {
    if (this.#onOpen) {
      this.removeEventListener('open', this.#onOpen)
    }
    this.#onOpen = value
    if (value) {
      this.addEventListener('open', value)
    }
  }

  override addEventListener<K extends keyof EventSourceEventMap>(
    type: K,
    listener: (this: EventSource, ev: EventSourceEventMap[K]) => unknown,
    options?: boolean | AddEventListenerOptions,
  ): void
  override addEventListener(
    type: string,
    listener: (this: EventSource, event: MessageEvent) => unknown,
    options?: boolean | AddEventListenerOptions,
  ): void
  override addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ): void
  override addEventListener(
    type: string,
    listener:
      | ((this: EventSource, event: MessageEvent) => unknown)
      | EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ): void {
    const listen = listener as (this: EventSource, event: Event) => unknown
    super.addEventListener(type, listen, options)
  }

  override removeEventListener<K extends keyof EventSourceEventMap>(
    type: K,
    listener: (this: EventSource, ev: EventSourceEventMap[K]) => unknown,
    options?: boolean | EventListenerOptions,
  ): void
  override removeEventListener(
    type: string,
    listener: (this: EventSource, event: MessageEvent) => unknown,
    options?: boolean | EventListenerOptions,
  ): void
  override removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions,
  ): void
  override removeEventListener(
    type: string,
    listener:
      | ((this: EventSource, event: MessageEvent) => unknown)
      | EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions,
  ): void {
    const listen = listener as (this: EventSource, event: Event) => unknown
    super.removeEventListener(type, listen, options)
  }

  constructor(url: string | URL, eventSourceInitDict?: EventSourceInit) {
    super()

    try {
      if (url instanceof URL) {
        this.#url = url
      } else if (typeof url === 'string') {
        this.#url = new URL(url, getBaseURL())
      } else {
        throw new Error('Invalid URL')
      }
    } catch {
      throw syntaxError('An invalid or illegal string was specified')
    }

    this.#parser = createParser({
      maxBufferSize: eventSourceInitDict?.maxBufferSize ?? DEFAULT_MAX_BUFFER_SIZE,
      onEvent: this.#onEvent,
      onError: this.#onParseError,
      onId: this.#onIdChange,
      onRetry: this.#onRetryChange,
    })

    this.#readyState = this.CONNECTING
    this.#reconnectInterval = 3000
    this.#fetch = eventSourceInitDict?.fetch ?? globalThis.fetch
    this.#withCredentials = eventSourceInitDict?.withCredentials ?? false

    this.#connect()
  }

  close(): void {
    if (this.#reconnectTimer) clearTimeout(this.#reconnectTimer)
    if (this.#readyState === this.CLOSED) return
    if (this.#controller) this.#controller.abort()
    this.#readyState = this.CLOSED
    this.#controller = undefined
  }

  // PRIVATES FOLLOW

  /**
   * Current connection state
   *
   * @internal
   */
  #readyState: number

  /**
   * Original URL used to connect.
   *
   * Note that this will stay the same even after a redirect.
   *
   * @internal
   */
  #url: URL

  /**
   * The destination URL after a redirect. Is reset on reconnection.
   *
   * @internal
   */
  #redirectUrl: URL | undefined

  /**
   * Whether to include credentials in the request
   *
   * @internal
   */
  #withCredentials: boolean

  /**
   * The fetch implementation to use
   *
   * @internal
   */
  #fetch: FetchLike

  /**
   * The reconnection time in milliseconds
   *
   * @internal
   */
  #reconnectInterval: number

  /**
   * Reference to an ongoing reconnect attempt, if any
   *
   * @internal
   */
  #reconnectTimer: ReturnType<typeof setTimeout> | undefined

  /**
   * The last event ID seen by the EventSource, which will be sent as `Last-Event-ID` in the
   * request headers on a reconnection attempt.
   *
   * @internal
   */
  #lastEventId: string | null = null

  /**
   * The AbortController instance used to abort the fetch request
   *
   * @internal
   */
  #controller: AbortController | undefined

  /**
   * Instance of an EventSource parser (`eventsource-parser` npm module)
   *
   * @internal
   */
  #parser: EventSourceParser

  /**
   * Holds the current error handler, attached through `onerror` property directly.
   * Note that `addEventListener('error', …)` will not be stored here.
   *
   * @internal
   */
  #onError: ((this: EventSource, ev: ErrorEvent) => unknown) | null = null

  /**
   * Holds the current message handler, attached through `onmessage` property directly.
   * Note that `addEventListener('message', …)` will not be stored here.
   *
   * @internal
   */
  #onMessage: ((this: EventSource, ev: MessageEvent) => unknown) | null = null

  /**
   * Holds the current open handler, attached through `onopen` property directly.
   * Note that `addEventListener('open', …)` will not be stored here.
   *
   * @internal
   */
  #onOpen: ((this: EventSource, ev: Event) => unknown) | null = null

  /**
   * Connect to the given URL and start receiving events
   *
   * @internal
   */
  #connect() {
    this.#readyState = this.CONNECTING
    this.#controller = new AbortController()

    // Browser tests are failing if we directly call `this.#fetch()`, thus the indirection.
    const fetch = this.#fetch
    fetch(this.#url, this.#getRequestOptions())
      .then(this.#onFetchResponse)
      .catch(this.#onFetchError)
  }

  /**
   * Handles the fetch response
   *
   * @param response - The Fetch(ish) response
   * @internal
   */
  #onFetchResponse = async (response: FetchLikeResponse) => {
    this.#parser.reset()

    const {body, redirected, status, headers} = response

    // [spec] a client can be told to stop reconnecting using the HTTP 204 No Content response code.
    if (status === 204) {
      // We still need to emit an error event - this mirrors the browser behavior,
      // and without it there is no way to tell the user that the connection was closed.
      this.#failConnection('Server sent HTTP 204, not reconnecting', 204)
      this.close()
      return
    }

    // [spec] …Event stream requests can be redirected using HTTP 301 and 307 redirects as with
    // [spec] normal HTTP requests.
    // Spec does not say anything about other redirect codes (302, 308), but this seems an
    // unintended omission, rather than a feature. Browsers will happily redirect on other 3xxs's.
    if (redirected) {
      this.#redirectUrl = new URL(response.url)
    } else {
      this.#redirectUrl = undefined
    }

    // [spec] if res's status is not 200, …, then fail the connection.
    if (status !== 200) {
      this.#failConnection(`Non-200 status code (${status})`, status)
      return
    }

    // [spec] …or if res's `Content-Type` is not `text/event-stream`, then fail the connection.
    const contentType = headers.get('content-type') || ''
    if (!contentType.startsWith('text/event-stream')) {
      this.#failConnection('Invalid content type, expected "text/event-stream"', status)
      return
    }

    // [spec] …if the readyState attribute is set to a value other than CLOSED…
    if (this.#readyState === this.CLOSED) {
      return
    }

    // [spec] …sets the readyState attribute to OPEN and fires an event
    // [spec] …named open at the EventSource object.
    this.#readyState = this.OPEN

    const openEvent = new Event('open')
    this.dispatchEvent(openEvent)

    // Ensure that the response stream is a web stream
    if (typeof body !== 'object' || !body || !('getReader' in body)) {
      this.#failConnection('Invalid response body, expected a web ReadableStream', status)
      this.close() // This should only happen if `fetch` provided is "faulty" - don't reconnect
      return
    }

    const decoder = new TextDecoder()

    const reader = body.getReader()
    let open = true

    do {
      const {done, value} = await reader.read()
      if (this.#readyState === this.CLOSED) {
        open = false
        break
      }

      if (value) {
        this.#parser.feed(decoder.decode(value, {stream: !done}))
      }

      if (!done) {
        continue
      }

      open = false
      this.#parser.reset()

      this.#scheduleReconnect()
    } while (open)
  }

  /**
   * Handles rejected requests for the EventSource endpoint
   *
   * @param err - The error from `fetch()`
   * @internal
   */
  #onFetchError = (err: Error & {type?: string}) => {
    this.#controller = undefined

    // We expect abort errors when the user manually calls `close()` - ignore those
    if (err.name === 'AbortError' || err.type === 'aborted') {
      return
    }

    this.#scheduleReconnect(flattenError(err))
  }

  /**
   * Get request options for the `fetch()` request
   *
   * @returns The request options
   * @internal
   */
  #getRequestOptions(): EventSourceFetchInit {
    const lastEvent = this.#lastEventId ? {'Last-Event-ID': this.#lastEventId} : undefined

    const init: EventSourceFetchInit = {
      // [spec] Let `corsAttributeState` be `Anonymous`…
      // [spec] …will have their mode set to "cors"…
      mode: 'cors',
      redirect: 'follow',
      headers: {Accept: 'text/event-stream', ...lastEvent},
      cache: 'no-store',
      signal: this.#controller?.signal,
    }

    // Some environments crash if attempting to set `credentials` where it is not supported,
    // eg on Cloudflare Workers. To avoid this, we only set it in browser-like environments.
    if ('window' in globalThis) {
      // [spec] …and their credentials mode set to "same-origin"
      // [spec] …if the `withCredentials` attribute is `true`, set the credentials mode to "include"…
      init.credentials = this.withCredentials ? 'include' : 'same-origin'
    }

    return init
  }

  /**
   * Called by EventSourceParser when a blank line ends a block containing a valid `id` field.
   * This runs before `#onEvent` when the same block also contains data.
   *
   * @param value - The value of the `id` field
   * @internal
   */
  #onIdChange = (value: string) => {
    this.#lastEventId = value
  }

  /**
   * Called by EventSourceParser instance when an event has successfully been parsed
   * and is ready to be processed.
   *
   * @param event - The parsed event
   * @internal
   */
  #onEvent = (event: EventSourceMessage) => {
    const origin = this.#redirectUrl ? this.#redirectUrl.origin : this.#url.origin
    // [spec] The `lastEventId` attribute is the last event ID string of the event
    // source, i.e. the persisted buffer (`#lastEventId`) - not the current event's `id`.
    // The buffer is only updated by an explicit `id` field and must survive an
    // event that omits `id`.
    const lastEventId = this.#lastEventId ?? ''

    const messageEvent = new MessageEvent(event.event || 'message', {
      data: event.data,
      origin,
      lastEventId,
    })

    // workerd (Cloudflare Workers) accepts `data` but silently drops `origin` and `lastEventId`
    // from the constructor init, yielding `null` and `''`. Both are plain own properties there
    // rather than prototype getters, so they can be assigned after the fact. Elsewhere the
    // constructor honours them and this is skipped, so no runtime pays for it unnecessarily.
    if (messageEvent.origin !== origin) {
      defineEventProperty(messageEvent, 'origin', origin)
    }

    if (messageEvent.lastEventId !== lastEventId) {
      defineEventProperty(messageEvent, 'lastEventId', lastEventId)
    }

    // The `onmessage` property only triggers on messages without an `event` field, or ones that
    // explicitly set `message`. This is handled automatically: the event is dispatched with type
    // `event.event || 'message'`, and `onmessage` is registered as a `message` event listener.
    this.dispatchEvent(messageEvent)
  }

  /**
   * Called by EventSourceParser instance when a new reconnection interval is received
   * from the EventSource endpoint.
   *
   * @param value - The new reconnection interval in milliseconds
   * @internal
   */
  #onRetryChange = (value: number) => {
    this.#reconnectInterval = value
  }

  /**
   * Called by EventSourceParser instance when a parse error occurs.
   *
   * @param error - The parser error
   * @internal
   */
  #onParseError = (error: ParseError) => {
    if (error.type !== 'max-buffer-size-exceeded') {
      return
    }

    this.close()
    this.#failConnection(error.message)
  }

  /**
   * Handles the process referred to in the EventSource specification as "failing a connection".
   *
   * @param error - The error causing the connection to fail
   * @param code - The HTTP status code, if available
   * @internal
   */
  #failConnection(message?: string, code?: number) {
    // [spec] …if the readyState attribute is set to a value other than CLOSED,
    // [spec] sets the readyState attribute to CLOSED…
    if (this.#readyState !== this.CLOSED) {
      this.#readyState = this.CLOSED
    }

    // [spec] …and fires an event named `error` at the `EventSource` object.
    // [spec] Once the user agent has failed the connection, it does not attempt to reconnect.
    // [spec] > Implementations are especially encouraged to report detailed information
    // [spec] > to their development consoles whenever an error event is fired, since little
    // [spec] > to no information can be made available in the events themselves.
    // Printing to console is not very programatically helpful, though, so we emit a custom event.
    const errorEvent = new ErrorEvent('error', {code, message})
    this.dispatchEvent(errorEvent)
  }

  /**
   * Schedules a reconnection attempt against the EventSource endpoint.
   *
   * @param message - The error causing the connection to fail
   * @param code - The HTTP status code, if available
   * @internal
   */
  #scheduleReconnect(message?: string, code?: number) {
    // [spec] If the readyState attribute is set to CLOSED, abort the task.
    if (this.#readyState === this.CLOSED) {
      return
    }

    // [spec] Set the readyState attribute to CONNECTING.
    this.#readyState = this.CONNECTING

    // [spec] Fire an event named `error` at the EventSource object.
    const errorEvent = new ErrorEvent('error', {code, message})
    this.dispatchEvent(errorEvent)

    // [spec] Wait a delay equal to the reconnection time of the event source.
    const timer = setTimeout(this.#reconnect, this.#reconnectInterval)

    // In Node.js (and Bun), a pending timer keeps the event loop alive, preventing the
    // process from exiting while we wait to reconnect. `unref()` opts out of that. Browsers
    // and Deno return a numeric handle with no `unref()`, so only call it when available.
    if (typeof timer === 'object' && timer !== null && 'unref' in timer) {
      timer.unref()
    }

    this.#reconnectTimer = timer
  }

  /**
   * Reconnects to the EventSource endpoint after a disconnect/failure
   *
   * @internal
   */
  #reconnect = () => {
    this.#reconnectTimer = undefined

    // [spec] If the EventSource's readyState attribute is not set to CONNECTING, then return.
    if (this.#readyState !== this.CONNECTING) {
      return
    }

    this.#connect()
  }
}

// The class is named `EventSourceImpl` to leave the `EventSource` name free for the interface and
// the const below. Restore the public name, so neither `EventSource.name` nor inspected instances
// (eg `console.log(eventSource)`) leak the implementation name.
Object.defineProperty(EventSourceImpl, 'name', {value: 'EventSource'})

// Provides a way to detect that the EventSource implementation supports passing `fetch`
// that can be used to customize the request, eg custom headers and similar.
Object.defineProperty(EventSourceImpl, Symbol.for('eventsource.supports-fetch-override'), {
  value: true,
  writable: false,
  configurable: false,
  enumerable: false,
})

/**
 * An `EventSource` instance opens a persistent connection to an HTTP server, which sends events
 * in `text/event-stream` format. The connection remains open until closed by calling `.close()`.
 *
 * @public
 * @example
 * ```js
 * const eventSource = new EventSource('https://example.com/stream')
 * eventSource.addEventListener('error', (error) => {
 *   console.error(error)
 * })
 * eventSource.addEventListener('message', (event) => {
 *  console.log('Received message:', event.data)
 * })
 * ```
 */
export const EventSource: EventSourceConstructor = EventSourceImpl

/**
 * According to spec, when constructing a URL:
 * > 1. Let baseURL be environment's base URL, if environment is a Document object
 * > 2. Return the result of applying the URL parser to url, with baseURL.
 *
 * Thus we should use `document.baseURI` if available, since it can be set through a base tag.
 *
 * @returns The base URL, if available - otherwise `undefined`
 * @internal
 */
function getBaseURL(): string | undefined {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doc = 'document' in globalThis ? (globalThis as any).document : undefined
  return doc && typeof doc === 'object' && 'baseURI' in doc && typeof doc.baseURI === 'string'
    ? doc.baseURI
    : undefined
}

/**
 * Assigns a `MessageEvent` property that the constructor's init dictionary was supposed to have
 * set, for runtimes that ignore it.
 *
 * Defined rather than assigned because on the runtimes that do implement the property as a
 * prototype getter, a plain assignment would throw in strict mode. `enumerable` and
 * `configurable` mirror how a spec-compliant implementation exposes it.
 *
 * @param event - The message event to define the property on
 * @param property - The property to define
 * @param value - The value the constructor should have set
 * @internal
 */
function defineEventProperty(
  event: MessageEvent,
  property: 'origin' | 'lastEventId',
  value: string,
): void {
  Object.defineProperty(event, property, {
    value,
    enumerable: true,
    configurable: true,
  })
}

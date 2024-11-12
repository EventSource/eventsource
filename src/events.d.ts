/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-redeclare */

//// DOM-like Events
// NB: The Event / EventTarget / EventListener implementations below were copied
// from lib.dom.d.ts, then edited to reflect Node's documentation at
// https://nodejs.org/api/events.html#class-eventtarget.
// Please read that link to understand important implementation differences.

// This conditional type will be the existing global Event in a browser, or
// the copy below in a Node environment.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type __Event = typeof globalThis extends {onmessage: any; Event: any}
  ? {}
  : {
      /**
       * Returns true or false depending on how event was initialized. True if event goes through its target's ancestors in reverse tree order, and false otherwise.
       */
      readonly bubbles: boolean
      readonly cancelable: boolean
      /**
       * Returns true or false depending on how event was initialized. True if event invokes listeners past a ShadowRoot node that is the root of its target, and false otherwise.
       */
      readonly composed: boolean
      readonly defaultPrevented: boolean
      readonly eventPhase: 0 | 2
      /**
       * Returns true if event was dispatched by the user agent, and
       * false otherwise.
       */
      readonly isTrusted: boolean
      returnValue: boolean
      /**
       * Returns the event's timestamp as the number of milliseconds measured relative to
       * the time origin.
       */
      readonly timeStamp: number
      /**
       * Unauthorized and redirect error status codes (for example 401, 403, 301, 307)
       */
      readonly status?: number | undefined
      /**
       * Returns the type of event, e.g.
       * "click", "hashchange", or
       * "submit".
       */
      readonly type: string
      /** Returns an array containing the current EventTarget as the only entry or empty if the event is not being dispatched. This is not used in Node.js and is provided purely for completeness. */
      composedPath(): [EventTarget?]
      preventDefault(): void
      /**
       * Invoking this method prevents event from reaching
       * any registered event listeners after the current one finishes running and, when dispatched in a tree, also prevents event from reaching any
       * other objects.
       */
      stopImmediatePropagation(): void
      /**
       * When dispatched in a tree, invoking this method prevents event from reaching any objects other than the current object.
       */
      stopPropagation(): void
    }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type __EventTarget = typeof globalThis extends {onmessage: any; EventTarget: any}
  ? {}
  : {
      /**
       * Adds a new handler for the `type` event. Any given `listener` is added only once per `type` and per `capture` option value.
       *
       * If the `once` option is true, the `listener` is removed after the next time a `type` event is dispatched.
       *
       * The `capture` option is not used by Node.js in any functional way other than tracking registered event listeners per the `EventTarget` specification.
       * Specifically, the `capture` option is used as part of the key when registering a `listener`.
       * Any individual `listener` may be added once with `capture = false`, and once with `capture = true`.
       */
      addEventListener(
        type: string,
        listener: EventListener | EventListenerObject,
        options?: AddEventListenerOptions | boolean,
      ): void
      /** Dispatches a synthetic event event to target and returns true if either event's cancelable attribute value is false or its preventDefault() method was not invoked, and false otherwise. */
      dispatchEvent(event: Event): boolean
      /** Removes the event listener in target's event listener list with the same type, callback, and options. */
      removeEventListener(
        type: string,
        listener: EventListener | EventListenerObject,
        options?: EventListenerOptions | boolean,
      ): void
    }

interface EventListenerObject {
  handleEvent(object: Event): void
}

interface EventInit {
  bubbles?: boolean
  cancelable?: boolean
  composed?: boolean
}

interface MessageEventInit<T = unknown> extends EventInit {
  data?: T | undefined
  lastEventId?: string | undefined
  origin?: string | undefined
}

interface EventListenerOptions {
  /** Not directly used by Node.js. Added for API completeness. Default: `false`. */
  capture?: boolean
}

interface AddEventListenerOptions extends EventListenerOptions {
  /** When `true`, the listener is automatically removed when it is first invoked. Default: `false`. */
  once?: boolean
  /** When `true`, serves as a hint that the listener will not call the `Event` object's `preventDefault()` method. Default: false. */
  passive?: boolean
  /** The listener will be removed when the given AbortSignal object's `abort()` method is called. */
  signal?: AbortSignal
}

/**
 * @public
 */
interface EventListener {
  (evt: Event | MessageEvent): void
}

/**
 * @public
 */
type EventListenerOrEventListenerObject = EventListener | EventListenerObject

/** The MessageEvent interface represents a message received by a target object. */
interface MessageEvent<T = unknown> extends Event {
  /**
   * Returns the data of the message.
   */
  readonly data: T
  /**
   * Returns the last event ID string, for server-sent events.
   */
  readonly lastEventId: string
  /**
   * Returns the origin of the message, for server-sent events and
   * cross-document messaging.
   */
  readonly origin: string
}
declare const MessageEvent: {
  prototype: MessageEvent
  new <T>(type: string, eventInitDict?: MessageEventInit<T>): MessageEvent<T>
}

import type {EventSource} from '../../src/EventSource.ts'

/**
 * A listener that records its calls and can be awaited until it has been called a given number
 * of times. Most of the suite tests behaviour that only becomes observable after N events -
 * a reconnect, a retry, a disconnect - so waiting on a call count is the main synchronisation
 * primitive.
 */
export interface CallCounter<T> {
  /** Pass to `addEventListener`, or assign to one of the `on*` handlers. */
  readonly listener: (event: T) => void
  /** Number of times the listener has been called so far. */
  readonly callCount: number
  /** Argument of the most recent call. Throws if it has not been called yet. */
  readonly lastArg: T
  /**
   * Resolves once the listener has been called exactly `num` times.
   *
   * Rejects if the count is already past `num`, since waiting for an event that has already
   * been and gone is a test bug rather than something that can still happen, and rejects if
   * `num` is not reached within `timeout` ms.
   */
  waitForCallCount(num: number, timeout?: number): Promise<void>
}

interface CallCounterOptions {
  name?: string
  onCall?: (info: {numCalls: number}) => void
}

export function getCallCounter<T = MessageEvent>({
  name = '',
  onCall,
}: CallCounterOptions = {}): CallCounter<T> {
  const listeners: [number, () => void][] = []

  let callCount = 0
  // Held in a wrapper so that `lastArg` can narrow it without an assertion - `undefined` is a
  // legitimate call argument, so its absence cannot stand in for "never called".
  let last: {event: T} | undefined

  function listener(event: T): void {
    callCount++
    last = {event}

    if (onCall) {
      onCall({numCalls: callCount})
    }

    for (const [wanted, resolve] of listeners) {
      if (wanted === callCount) {
        resolve()
      }
    }
  }

  return {
    listener,

    get callCount() {
      return callCount
    },

    get lastArg() {
      if (!last) {
        throw new Error(`${name || 'Counter'} has not been called`)
      }
      return last.event
    },

    waitForCallCount(num: number, timeout: number = 10000) {
      return Promise.race([
        new Promise<void>((resolve, reject) => {
          if (callCount > num) {
            reject(new Error(`Already past ${name} call count of ${num}`))
          } else if (callCount === num) {
            resolve()
          } else {
            listeners.push([num, resolve])
          }
        }),
        new Promise<void>((_, reject) => {
          setTimeout(reject, timeout, new Error(`Timeout waiting for ${name} call count of ${num}`))
        }),
      ])
    },
  }
}

/**
 * Closes an EventSource after a short delay, giving any in-flight reconnect the chance to
 * happen - and thus be caught - before the test tears the connection down.
 */
export function deferClose(es: EventSource, timeout = 25): Promise<void> {
  return new Promise((resolve) => setTimeout(() => resolve(es.close()), timeout))
}

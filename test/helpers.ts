import sinon, {type SinonSpy} from 'sinon'

import {EventSource} from '../src/EventSource'

type MessageReceiver = SinonSpy & {
  waitForCallCount: (num: number, timeout?: number) => Promise<void>
}

const TYPE_ASSERTER = Symbol.for('waffle.type-asserter')
const PATTERN_ASSERTER = Symbol.for('waffle.pattern-asserter')

export class ExpectationError extends Error {
  type = 'ExpectationError'

  public expected: unknown
  public got: unknown

  constructor(message: string, expected?: unknown, got?: unknown) {
    super(message)
    this.name = 'ExpectationError'
    this.expected = expected
    this.got = got
  }
}

interface CallCounterOptions {
  name?: string
  onCall?: (info: {numCalls: number}) => void
}

export function getCallCounter({name = '', onCall}: CallCounterOptions = {}): MessageReceiver {
  const listeners: [number, () => void][] = []

  let numCalls = 0
  const spy = sinon.fake(() => {
    numCalls++

    if (onCall) {
      onCall({numCalls})
    }

    listeners.forEach(([wanted, resolve]) => {
      if (wanted === numCalls) {
        resolve()
      }
    })
  })

  const fn = spy as unknown as MessageReceiver
  fn.waitForCallCount = (num: number, timeout: number = 10000) => {
    return Promise.race([
      new Promise<void>((resolve, reject) => {
        if (numCalls > num) {
          reject(new Error(`Already past ${name} call count of ${num}`))
        } else if (numCalls === num) {
          resolve()
        } else {
          listeners.push([num, resolve])
        }
      }),
      new Promise<void>((_, reject) => {
        setTimeout(reject, timeout, new Error(`Timeout waiting for ${name} call count of ${num}`))
      }),
    ])
  }

  return fn
}

export function deferClose(es: EventSource, timeout = 25): Promise<void> {
  return new Promise((resolve) => setTimeout(() => resolve(es.close()), timeout))
}

export function expect(
  thing: unknown,
  descriptor: string = '',
): {
  toBe(expected: unknown): void
  notToBe(expected: unknown): void
  toBeLessThan(thanNum: number): void
  toMatchObject(expected: Record<string, unknown>): void
  toThrowError(expectedMessage: RegExp): void
} {
  return {
    toBe(expected: unknown) {
      if (thing === expected) {
        return
      }

      if (descriptor) {
        throw new ExpectationError(
          `Expected ${descriptor} to be ${JSON.stringify(expected)}, got ${JSON.stringify(thing)}`,
        )
      }

      throw new ExpectationError(
        `Expected ${JSON.stringify(thing)} to be ${JSON.stringify(expected)}`,
      )
    },

    notToBe(expected: unknown) {
      if (thing !== expected) {
        return
      }

      if (descriptor) {
        throw new ExpectationError(
          `Expected ${descriptor} NOT to be ${JSON.stringify(expected)}, got ${JSON.stringify(thing)}`,
        )
      }

      throw new ExpectationError(
        `Expected ${JSON.stringify(thing)} NOT to be ${JSON.stringify(expected)}`,
      )
    },

    toBeLessThan(thanNum: number) {
      if (typeof thing !== 'number' || thing >= thanNum) {
        throw new ExpectationError(`Expected ${thing} to be less than ${thanNum}`)
      }
    },

    toMatchObject(expected: Record<string, unknown>) {
      if (!isPlainObject(thing)) {
        throw new ExpectationError(`Expected an object, was... not`)
      }

      Object.keys(expected).forEach((key) => {
        if (!(key in thing)) {
          throw new ExpectationError(
            `Expected key "${key}" to be in ${descriptor || 'object'}, was not`,
            expected,
            thing,
          )
        }

        if (
          typeof expected[key] === 'object' &&
          expected[key] !== null &&
          TYPE_ASSERTER in expected[key]
        ) {
          if (typeof thing[key] !== expected[key][TYPE_ASSERTER]) {
            throw new ExpectationError(
              `Expected key "${key}" of ${descriptor || 'object'} to be any of type ${expect[key][TYPE_ASSERTER]}, got ${typeof thing[key]}`,
            )
          }
          return
        }

        if (
          typeof expected[key] === 'object' &&
          expected[key] !== null &&
          PATTERN_ASSERTER in expected[key]
        ) {
          if (typeof thing[key] !== 'string') {
            throw new ExpectationError(
              `Expected key "${key}" of ${descriptor || 'object'} to be a string, got ${typeof thing[key]}`,
            )
          }

          if (typeof expected[key][PATTERN_ASSERTER] === 'string') {
            if (!thing[key].includes(expected[key][PATTERN_ASSERTER])) {
              throw new ExpectationError(
                `Expected key "${key}" of ${descriptor || 'object'} to include "${expected[key][PATTERN_ASSERTER]}", got "${thing[key]}"`,
              )
            }
            return
          }

          if (expected[key][PATTERN_ASSERTER] instanceof RegExp) {
            if (!expected[key][PATTERN_ASSERTER].test(thing[key])) {
              throw new ExpectationError(
                `Expected key "${key}" of ${descriptor || 'object'} to match pattern ${expected[key][PATTERN_ASSERTER]}, got "${thing[key]}"`,
              )
            }
            return
          }

          throw new Error('Invalid pattern asserter')
        }

        if (thing[key] !== expected[key]) {
          throw new ExpectationError(
            `Expected key "${key}" of ${descriptor || 'object'} to be ${JSON.stringify(expected[key])}, was ${JSON.stringify(
              thing[key],
            )}`,
          )
        }
      })
    },

    toThrowError(expectedMessage: RegExp) {
      if (typeof thing !== 'function') {
        throw new ExpectationError(
          `Expected a function that was going to throw, but wasn't a function`,
        )
      }

      try {
        thing()
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : `${err}`
        if (!expectedMessage.test(message)) {
          throw new ExpectationError(
            `Expected error message to match ${expectedMessage}, got ${message}`,
          )
        }
        return
      }

      throw new ExpectationError('Expected function to throw error, but did not')
    },
  }
}

expect.any = (
  type: 'string' | 'number' | 'bigint' | 'boolean' | 'symbol' | 'undefined' | 'object' | 'function',
) => {
  return {
    [TYPE_ASSERTER]: type,
  }
}

expect.stringMatching = (expected: string | RegExp) => {
  return {
    [PATTERN_ASSERTER]: expected,
  }
}

function isPlainObject(obj: unknown): obj is Record<string, unknown> {
  return typeof obj === 'object' && obj !== null && !Array.isArray(obj)
}

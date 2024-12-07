import {ExpectationError} from '../helpers.js'
import type {
  TestEndEvent,
  TestFailEvent,
  TestFn,
  TestPassEvent,
  TestRunner,
  TestRunnerOptions,
  TestStartEvent,
} from './types.js'

interface TestDefinition {
  title: string
  timeout: number
  action: TestFn
  only?: boolean
}

const DEFAULT_TIMEOUT = 15000

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const noop = (_event: unknown) => {
  /* intentional noop */
}

export function createRunner(options: TestRunnerOptions = {}): TestRunner {
  const {onEvent = noop, onStart = noop, onPass = noop, onFail = noop, onEnd = noop} = options
  const tests: TestDefinition[] = []

  let hasOnlyTest = false
  let running = false
  let passes = 0
  let failures = 0
  let suiteStart = 0

  function registerTest(title: string, fn: TestFn, timeout?: number, only?: boolean): void {
    if (running) {
      throw new Error('Cannot register a test while tests are running')
    }

    if (only && !hasOnlyTest) {
      // Clear the current tests
      hasOnlyTest = true
      while (tests.length > 0) {
        tests.pop()
      }
    }

    if (!hasOnlyTest || only) {
      tests.push({
        title,
        timeout: timeout ?? DEFAULT_TIMEOUT,
        action: fn,
        only,
      })
    }
  }

  registerTest.skip = (...args: unknown[]): void => noop(args)

  registerTest.only = (title: string, fn: TestFn, timeout?: number): void => {
    return registerTest(title, fn, timeout, true)
  }

  async function runTests(): Promise<TestEndEvent> {
    running = true
    suiteStart = Date.now()

    const start: TestStartEvent = {
      event: 'start',
      tests: tests.length,
    }

    onStart(start)
    onEvent(start)

    for (const test of tests) {
      const startTime = Date.now()
      try {
        await Promise.race([test.action(), getTimeoutPromise(test.timeout)])
        passes++
        const pass: TestPassEvent = {
          event: 'pass',
          duration: Date.now() - startTime,
          title: test.title,
        }
        onPass(pass)
        onEvent(pass)
      } catch (err: unknown) {
        failures++

        let error: string
        if (err instanceof ExpectationError) {
          error = err.message
          if (typeof err.expected !== 'undefined' || typeof err.got !== 'undefined') {
            error += `\n\nExpected: ${inspect(err.expected)}\nGot: ${inspect(err.got)}`
          }
        } else if (err instanceof Error) {
          const stack = (err.stack || '').toString()
          error = stack.includes(err.message) ? stack : `${err.message}\n\n${stack}`
        } else {
          error = `${err}`
        }

        const fail: TestFailEvent = {
          event: 'fail',
          title: test.title,
          duration: Date.now() - startTime,
          error,
        }
        onFail(fail)
        onEvent(fail)
      }
    }

    const end: TestEndEvent = {
      event: 'end',
      success: failures === 0,
      failures,
      passes,
      tests: tests.length,
      duration: Date.now() - suiteStart,
    }
    onEnd(end)
    onEvent(end)

    running = false

    return end
  }

  function getTestCount() {
    return tests.length
  }

  function isRunning() {
    return running
  }

  return {
    isRunning,
    getTestCount,
    registerTest,
    runTests,
  }
}

function getTimeoutPromise(ms: number) {
  return new Promise((_resolve, reject) => {
    setTimeout(reject, ms, new Error(`Test timed out after ${ms} ms`))
  })
}

function inspect(thing: unknown) {
  return JSON.stringify(thing, null, 2)
}

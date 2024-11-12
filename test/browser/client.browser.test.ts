/* eslint-disable no-console */
/**
 * This module:
 * - Starts a development server
 * - Spawns browsers and points them at the server
 * - Runs the tests in the browser (using waffletest)
 * - Reports results from browser to node using the registered function `reportTest`
 * - Prints the test results to the console
 *
 * Is this weird? Yes.
 * Is there a better way? Maybe. But I haven't found one.
 *
 * Supported flags:
 *
 * --browser=firefox|chromium|webkit
 * --no-close
 * --no-headless
 * --serial
 */
import {type BrowserType, chromium, firefox, webkit} from 'playwright'

import {getServer} from '../server.js'
import {type TestEvent} from '../waffletest/index.js'
import {nodeReporter} from '../waffletest/reporters/nodeReporter.js'

type BrowserName = 'firefox' | 'chromium' | 'webkit'

const browsers: Record<BrowserName, BrowserType> = {
  firefox,
  chromium,
  webkit,
}

const {onPass: reportPass, onFail: reportFail, onEnd: reportEnd} = nodeReporter

const BROWSER_TEST_PORT = 3883
const RUN_IN_SERIAL = process.argv.includes('--serial')
const NO_HEADLESS = process.argv.includes('--no-headless')
const NO_CLOSE = process.argv.includes('--no-close')

const browserFlag = getBrowserFlag()
if (browserFlag && !isDefinedBrowserType(browserFlag)) {
  throw new Error(`Invalid browser flag. Must be one of: ${Object.keys(browsers).join(', ')}`)
}

const browserFlagType = isDefinedBrowserType(browserFlag) ? browsers[browserFlag] : undefined

// Run the tests in browsers
;(async function run() {
  const server = await getServer(BROWSER_TEST_PORT)
  const jobs =
    browserFlag && browserFlagType
      ? [{name: browserFlag, browserType: browserFlagType}]
      : Object.entries(browsers).map(([name, browserType]) => ({name, browserType}))

  // Run all browsers in parallel, unless --serial is defined
  let totalFailures = 0
  let totalTests = 0

  if (RUN_IN_SERIAL) {
    for (const job of jobs) {
      const {failures, tests} = reportBrowserResult(job.name, await runBrowserTest(job.browserType))
      totalFailures += failures
      totalTests += tests
    }
  } else {
    await Promise.all(
      jobs.map(async (job) => {
        const {failures, tests} = reportBrowserResult(
          job.name,
          await runBrowserTest(job.browserType),
        )
        totalFailures += failures
        totalTests += tests
      }),
    )
  }

  function reportBrowserResult(
    browserName: string,
    events: TestEvent[],
  ): {failures: number; passes: number; tests: number} {
    console.log(`Browser: ${browserName}`)

    let passes = 0
    let failures = 0
    for (const event of events) {
      switch (event.event) {
        case 'start':
          // Ignored
          break
        case 'pass':
          passes++
          reportPass(event)
          break
        case 'fail':
          failures++
          reportFail(event)
          break
        case 'end':
          reportEnd(event)
          break
        default:
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          throw new Error(`Unexpected event: ${(event as any).event}`)
      }
    }

    return {failures, passes, tests: passes + failures}
  }

  console.log(`Ran ${totalTests} tests against ${jobs.length} browsers`)

  await server.close()

  if (totalFailures > 0) {
    // eslint-disable-next-line no-process-exit
    process.exit(1)
  }
})()

async function runBrowserTest(browserType: BrowserType): Promise<TestEvent[]> {
  let resolve: (value: TestEvent[] | PromiseLike<TestEvent[]>) => void
  const promise = new Promise<TestEvent[]>((_resolve) => {
    resolve = _resolve
  })

  const domain = getBaseUrl(BROWSER_TEST_PORT)
  const browser = await browserType.launch({headless: !NO_HEADLESS})
  const context = await browser.newContext()
  await context.clearCookies()

  const page = await context.newPage()
  const events: TestEvent[] = []

  await page.exposeFunction('reportTest', async (event: TestEvent) => {
    events.push(event)

    if (event.event !== 'end') {
      return
    }

    // Teardown
    if (!NO_CLOSE) {
      await context.close()
      await browser.close()
    }
    resolve(events)
  })

  await page.goto(`${domain}/browser-test`)

  return promise
}

function isDefinedBrowserType(browserName: string | undefined): browserName is BrowserName {
  return typeof browserName === 'string' && browserName in browsers
}

function getBrowserFlag(): BrowserName | undefined {
  const resolved = (function getFlag() {
    // Look for --browser <browserName>
    const flagIndex = process.argv.indexOf('--browser')
    let flag = flagIndex === -1 ? undefined : process.argv[flagIndex + 1]
    if (flag) {
      return flag
    }

    // Look for --browser=<browserName>
    flag = process.argv.find((arg) => arg.startsWith('--browser='))
    return flag ? flag.split('=')[1] : undefined
  })()

  if (!resolved) {
    return undefined
  }

  if (!isDefinedBrowserType(resolved)) {
    throw new Error(`Invalid browser flag. Must be one of: ${Object.keys(browsers).join(', ')}`)
  }

  return resolved
}

function getBaseUrl(port: number): string {
  return typeof document === 'undefined'
    ? `http://127.0.0.1:${port}`
    : `${location.protocol}//${location.hostname}:${port}`
}

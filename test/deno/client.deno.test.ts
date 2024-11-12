import {getServer} from '../server.js'
import {registerTests} from '../tests.js'
import {createRunner} from '../waffletest/index.js'
import {nodeReporter} from '../waffletest/reporters/nodeReporter.js'

const DENO_TEST_PORT = 3950

// Run the tests in deno
;(async function run() {
  const server = await getServer(DENO_TEST_PORT)

  const runner = registerTests({
    environment: 'deno',
    runner: createRunner(nodeReporter),
    fetch: globalThis.fetch,
    port: DENO_TEST_PORT,
  })

  const result = await runner.runTests()

  // Teardown
  await server.close()

  if (typeof process !== 'undefined' && 'exit' in process && typeof process.exit === 'function') {
    // eslint-disable-next-line no-process-exit
    process.exit(result.failures)
  } else if (typeof globalThis.Deno !== 'undefined') {
    globalThis.Deno.exit(result.failures)
  } else if (result.failures > 0) {
    throw new Error(`Tests failed: ${result.failures}`)
  }
})()

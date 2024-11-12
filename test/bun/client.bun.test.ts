import {getServer} from '../server.js'
import {registerTests} from '../tests.js'
import {createRunner} from '../waffletest/index.js'
import {nodeReporter} from '../waffletest/reporters/nodeReporter.js'

const BUN_TEST_PORT = 3946

// Run the tests in bun
;(async function run() {
  const server = await getServer(BUN_TEST_PORT)

  const runner = registerTests({
    environment: 'bun',
    runner: createRunner(nodeReporter),
    fetch: globalThis.fetch,
    port: BUN_TEST_PORT,
  })

  const result = await runner.runTests()

  // Teardown
  await server.close()

  // eslint-disable-next-line no-process-exit
  process.exit(result.failures)
})()

import {getServer} from '../server.ts'
import {registerTests} from '../tests.ts'
import {createRunner} from '../waffletest/index.ts'
import {nodeReporter} from '../waffletest/reporters/nodeReporter.ts'

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
  await Promise.race([server.close(), new Promise((resolve) => setTimeout(resolve, 5000))])

  // eslint-disable-next-line no-process-exit
  process.exit(result.failures)
})()

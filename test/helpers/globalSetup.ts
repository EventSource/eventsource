import type {TestProject} from 'vitest/node'

import {TEST_PORT} from './routes.ts'
import {createTestServer} from './server.ts'

/**
 * Starts the standalone test server for the suites that do not run in a browser. The browser
 * suite does not use this at all - it serves the same routes from Vitest's own Vite server, to
 * stay same-origin with the test page - and provides its own port instead.
 */
export default async function setup(project: TestProject): Promise<() => Promise<void>> {
  const server = await createTestServer(TEST_PORT)
  project.provide('port', TEST_PORT)

  /**
   * Keeps this process's event loop turning for as long as the server is up.
   *
   * The server runs here, in Vitest's main process, while the tests run in a worker. Under Deno
   * that is not enough on its own: with only an idle listening socket pending, the main process
   * stops servicing the server's timer-driven writes, so any endpoint that sends data after a
   * delay stalls after the first couple of chunks - and since delays are how reconnects and
   * trickling streams are tested, most of the suite hangs. A live timer keeps the loop hot.
   * Harmless on the other runtimes, which do not need it.
   */
  const keepAlive = setInterval(() => {}, 100)

  return async () => {
    clearInterval(keepAlive)
    server.closeAllConnections()
    await new Promise<void>((resolve) => server.close(() => resolve()))
  }
}

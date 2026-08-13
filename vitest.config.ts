import {defineConfig, type ViteUserConfig} from 'vitest/config'

import {TEST_PORT} from './test/helpers/routes.ts'

/**
 * Starts the standalone test server. Used by every suite except the browser one, which serves
 * the same routes from Vitest's own Vite server instead so that the test page and the endpoints
 * share an origin (see `test/helpers/ssePlugin.ts`).
 */
export const standaloneServer = ['./test/helpers/globalSetup.ts']

/**
 * Shared by every `vitest.*.config.ts`. The same suite - `test/client.test.ts` - runs under all
 * of them; what differs is the runtime it executes in, and where the test endpoints are served
 * from. Which config is running gets passed to the tests through `provide`, because several of
 * these environments cannot reliably be told apart from the inside: happy-dom presents a
 * `document`, and node, bun and deno all share this base config.
 */
export const sharedConfig = {
  include: ['test/client.test.ts'],
  // Several tests wait out multiple reconnects against a 250ms retry, so the 5s default is tight.
  testTimeout: 15000,
  reporters: process.env['GITHUB_ACTIONS'] ? ['default', 'github-actions'] : 'default',
} satisfies ViteUserConfig['test']

// Base config: node, and the same file run under `bun run vitest` and `deno run -A npm:vitest`.
export default defineConfig({
  test: {
    ...sharedConfig,
    environment: 'node',
    globalSetup: standaloneServer,
    provide: {port: TEST_PORT, suite: 'node'},
  },
})

import {defineConfig} from 'vitest/config'
import {androidPool, iosPool} from 'vitest-pool-react-native'

import {TEST_PORT} from './test/helpers/routes.ts'
import {sharedConfig, standaloneServer} from './vitest.config.ts'

/**
 * The same suite, run in React Native's Hermes runtime with `vitest-pool-react-native`: one
 * project for an iOS simulator and one for an Android emulator. Metro bundles
 * `test/client.test.ts` and `src/` as an app would see them, and Vitest reports the results here.
 *
 * Reuses the standalone test server from the Node suite. The simulator shares the host's loopback
 * interface, so `127.0.0.1` reaches it directly. An Android emulator does not, so its tests can't
 * reach the server until the port is forwarded with `adb reverse`.
 *
 * Not expected to pass: React Native's `fetch` does not stream response bodies, which `EventSource`
 * relies on.
 */
// `env.ts` calls `inject` from `vitest`, so the pool has to give it the same runner `vitest` as the
// test file instead of the real package.
const testHelpers = ['test/helpers/env.ts']

const base = {
  ...sharedConfig,
  // Print each test as it finishes, so a hang points at the first test with no result.
  reporters: process.env['GITHUB_ACTIONS'] ? ['verbose', 'github-actions'] : ['verbose'],
  globalSetup: standaloneServer,
  provide: {port: TEST_PORT, suite: 'react-native'},
} as const

export default defineConfig({
  test: {
    projects: [
      {test: {...base, name: 'ios', pool: iosPool({testHelpers})}},
      {test: {...base, name: 'android', pool: androidPool({testHelpers})}},
    ],
  },
})

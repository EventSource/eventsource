import {defineConfig} from 'vitest/config'
import {iosPool} from 'vitest-pool-react-native'

import {TEST_PORT} from './test/helpers/routes.ts'
import {sharedConfig, standaloneServer} from './vitest.config.ts'

/**
 * The same suite, run in React Native's Hermes runtime on an iOS simulator with
 * `vitest-pool-react-native`. Metro bundles `test/client.test.ts` and `src/` as an iOS app would
 * see them, and Vitest reports the results here.
 *
 * Reuses the standalone test server from the Node suite. The simulator shares the host's loopback
 * interface, so `127.0.0.1` reaches it directly. That is not true on an Android emulator, which
 * would need `adb reverse` for the test server port, so there is no Android project here.
 *
 * Not expected to pass: React Native's `fetch` does not stream response bodies, which `EventSource`
 * relies on.
 */
export default defineConfig({
  test: {
    ...sharedConfig,
    name: 'ios',
    pool: iosPool(),
    globalSetup: standaloneServer,
    provide: {port: TEST_PORT, suite: 'react-native'},
  },
})

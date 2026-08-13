import {defineConfig} from 'vitest/config'

import {TEST_PORT} from './test/helpers/routes.ts'
import {sharedConfig, standaloneServer} from './vitest.config.ts'

/**
 * happy-dom presents a browser-like global environment on top of node, so the suite runs its
 * browser-semantics tests here (CORS, cookies, `withCredentials`) while still talking to the
 * standalone server.
 *
 * This suite is expected to fail for now: happy-dom's CORS handling does not yet line up with a
 * real browser's, which is being worked through separately. It runs non-blocking in CI so the
 * failures stay visible without gating the other environments.
 */
export default defineConfig({
  test: {
    ...sharedConfig,
    environment: 'happy-dom',
    // happy-dom otherwise defaults `location` to `http://localhost:3000`, so give it the server's
    // origin - that is the split the browser suite is written against. Note that happy-dom still
    // reports these requests as cross-origin and blocks them, which is part of what is being
    // worked through separately.
    environmentOptions: {happyDom: {url: `http://127.0.0.1:${TEST_PORT}`}},
    globalSetup: standaloneServer,
    provide: {port: TEST_PORT, suite: 'happy-dom'},
  },
})

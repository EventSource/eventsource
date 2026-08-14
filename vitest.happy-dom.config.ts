import {defineConfig} from 'vitest/config'

import {TEST_PORT} from './test/helpers/routes.ts'
import {sharedConfig, standaloneServer} from './vitest.config.ts'

/**
 * happy-dom presents a browser-like global environment on top of node, so the suite runs its
 * browser-semantics tests here (CORS, cookies, `withCredentials`) while still talking to the
 * standalone server.
 *
 * The one behaviour it does not match a real browser on is stripping `Authorization` from a
 * cross-origin redirect; `test/client.test.ts` marks those four tests as known failures.
 */
export default defineConfig({
  test: {
    ...sharedConfig,
    environment: 'happy-dom',
    // Point `location` at the server, so its requests are same-origin - the split the browser
    // suite is written against. happy-dom otherwise defaults to `http://localhost:3000`, and
    // every request to the server then counts as cross-origin.
    //
    // The key is `happyDOM`, not `happyDom`: `EnvironmentOptions` carries an index signature, so
    // a misspelling type-checks and is then silently ignored, leaving the default URL in place.
    environmentOptions: {happyDOM: {url: `http://127.0.0.1:${TEST_PORT}`}},
    globalSetup: standaloneServer,
    provide: {port: TEST_PORT, suite: 'happy-dom'},
  },
})

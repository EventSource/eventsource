import {cloudflareTest} from '@cloudflare/vitest-pool-workers'
import {defineConfig} from 'vitest/config'

import {TEST_PORT} from './test/helpers/routes.ts'
import {sharedConfig, standaloneServer} from './vitest.config.ts'

/**
 * Runs the suite on workerd, the runtime behind Cloudflare Workers, through miniflare. Unlike
 * the browser suites this is a server-side environment, so it neither enforces CORS nor keeps a
 * cookie jar - it should behave like node.
 *
 * `nodejs_compat` is deliberately not enabled: the client has to work on bare workerd, and the
 * flag would let the resolver match the `node` export condition. `compatibilityDate` is
 * required, as workerd refuses to start without one.
 *
 * This suite is expected to fail for now, and runs non-blocking in CI so the failures stay
 * visible without gating the other environments.
 */
export default defineConfig({
  plugins: [
    cloudflareTest({
      miniflare: {
        compatibilityDate: '2026-06-01',
        compatibilityFlags: [],
      },
    }),
  ],
  test: {
    ...sharedConfig,
    globalSetup: standaloneServer,
    provide: {port: TEST_PORT, suite: 'workerd'},
  },
})

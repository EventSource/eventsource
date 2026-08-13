import {playwright} from '@vitest/browser-playwright'
import {defineConfig} from 'vitest/config'

import {BROWSER_PORT} from './test/helpers/routes.ts'
import {ssePlugin} from './test/helpers/ssePlugin.ts'
import {sharedConfig} from './vitest.config.ts'

export default defineConfig({
  plugins: [ssePlugin()],
  test: {
    ...sharedConfig,
    // No `globalSetup`: the endpoints are served by the plugin above, not a standalone server.
    provide: {port: BROWSER_PORT, suite: 'browser'},
    browser: {
      enabled: true,
      provider: playwright(),
      // `127.0.0.1` rather than `localhost`, so that `localhost` is left over to serve as the
      // second origin the CORS and cross-origin redirect tests need.
      api: {host: '127.0.0.1', port: BROWSER_PORT},
      instances: [
        {browser: 'chromium', headless: true},
        {browser: 'firefox', headless: true},
        {browser: 'webkit', headless: true},
      ],
    },
  },
})

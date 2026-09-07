import {defineConfig} from 'vitest/config'

import {iosSimulator} from './test/helpers/iosSimulator.ts'
import {BROWSER_PORT} from './test/helpers/routes.ts'
import {ssePlugin} from './test/helpers/ssePlugin.ts'
import {sharedConfig} from './vitest.config.ts'

/**
 * The browser suite, run in Safari on an iOS simulator - the one WebKit build we cannot get at
 * through Playwright, and the one where fetch-based `EventSource` gets reported broken.
 *
 * macOS with Xcode's iOS platform installed only. Everything else about the arrangement matches
 * `vitest.browser.config.ts`, including serving the endpoints from Vitest's own Vite server so
 * the page and the endpoints stay same-origin.
 */
export default defineConfig({
  plugins: [ssePlugin()],
  test: {
    ...sharedConfig,
    provide: {port: BROWSER_PORT, suite: 'browser'},
    browser: {
      enabled: true,
      provider: iosSimulator(),
      // The simulator reaches the host on loopback, so this is the same address (and the same
      // `localhost` second origin) the Playwright browsers use.
      api: {host: '127.0.0.1', port: BROWSER_PORT},
      // The default budget is spent well before a cold simulator has booted - the clock starts
      // while the provider is still booting, not once the page is open. `npm run test:ios:boot`
      // takes the boot out of this window; the headroom is for when it has not been run.
      connectTimeout: 300_000,
      // Safari on a simulator cannot be run headless, and there is no browser binary to pick:
      // the instance exists only to name the run.
      instances: [{browser: 'safari', headless: false}],
    },
  },
})

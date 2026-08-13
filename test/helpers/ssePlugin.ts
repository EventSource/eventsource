import type {Plugin} from 'vite'

import {handleRequest} from './server.ts'

/**
 * Serves the test endpoints from Vitest's own Vite dev server.
 *
 * The browser suite loads its test page from that server, so mounting the endpoints here is what
 * keeps the two same-origin - the arrangement the suite's CORS, cookie and redirect expectations
 * are written against. Point the browser tests at a separately started server instead and every
 * request becomes cross-origin, which quietly changes what those tests mean.
 */
export function ssePlugin(): Plugin {
  return {
    name: 'eventsource-test-endpoints',
    configureServer(server) {
      server.middlewares.use(handleRequest)

      // Move ourselves to the front of the connect stack.
      //
      // Vite installs its own CORS middleware ahead of plugin middleware. Firefox and WebKit
      // send a CORS preflight for the second leg of a cross-origin redirect (Chromium does not),
      // and Vite's middleware answers that OPTIONS request under its own policy before the test
      // server ever sees it - which fails the cross-origin redirect tests in those two engines
      // only. The test server owns CORS for its own routes, exactly as it did when a standalone
      // node server served them, so it has to be given the request first.
      const layer = server.middlewares.stack.pop()
      if (layer) {
        server.middlewares.stack.unshift(layer)
      }
    },
  }
}

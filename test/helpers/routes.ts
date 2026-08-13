/**
 * Constants shared by the test server, the configs and the tests themselves.
 *
 * Deliberately free of node imports: the tests import this module, and in the browser suite they
 * are bundled for and executed in the browser, where anything reaching into `node:*` fails to
 * load. The server itself lives in `server.ts`, which nothing browser-side imports.
 */

/**
 * All test endpoints live under this prefix.
 *
 * The browser suite mounts the endpoints onto Vitest's own Vite dev server (see `ssePlugin.ts`)
 * so that the test page and the endpoints share an origin, exactly as they did when a single
 * node server served both. Namespacing keeps us clear of Vite's own routes - most importantly
 * `/`, which Vite serves its HTML from.
 */
export const ROUTE_PREFIX = '/sse'

/** Port the standalone test server binds, for every suite that is not the browser one. */
export const TEST_PORT = 3944

/**
 * Port for Vitest's Vite server in the browser suite, which serves both the test page and the
 * test endpoints. Pinning it is what lets the tests address the endpoints on the same origin the
 * page was loaded from; with a random port they could not know it up front.
 */
export const BROWSER_PORT = 3883

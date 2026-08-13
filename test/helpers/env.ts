import {inject} from 'vitest'

import type {FetchLike} from '../../src/index.ts'
import {ROUTE_PREFIX} from './routes.ts'

/**
 * Which `vitest.*.config.ts` is driving the current run. Provided by the config rather than
 * sniffed at runtime, because several suites are deliberately hard to tell apart from the
 * inside: happy-dom presents a `document`, and node/bun/deno all share the base config.
 */
export type Suite = 'node' | 'browser' | 'happy-dom' | 'workerd'

declare module 'vitest' {
  interface ProvidedContext {
    /** Which `vitest.*.config.ts` is running. */
    suite: Suite
    /** Port the test endpoints are reachable on. */
    port: number
  }
}

export const suite: Suite = inject('suite')

/**
 * Origin the test endpoints are served from.
 *
 * For the browser suite this is Vitest's own Vite dev server (its port is pinned in
 * `vitest.browser.config.ts`), which is also the origin the test page itself is loaded from -
 * so browser requests to it are same-origin, matching how the endpoints and the page used to
 * be served by one and the same node server. Every other suite talks to the standalone server
 * that `globalSetup.ts` starts.
 */
export const serverOrigin = `http://127.0.0.1:${inject('port')}`

/** Base URL for the test endpoints, eg `http://127.0.0.1:3944/sse`. */
export const serverUrl = `${serverOrigin}${ROUTE_PREFIX}`

/**
 * A second origin that resolves to the same server, for exercising CORS and cross-origin
 * redirects. `localhost` and `127.0.0.1` are distinct origins to a browser, but both reach the
 * server: the standalone one listens dual-stack, and Vite's is reached over the loopback the
 * browser falls back to.
 */
export const crossOrigin = serverOrigin.replace('127.0.0.1', 'localhost')

/** Cross-origin equivalent of `serverUrl`. */
export const crossOriginUrl = `${crossOrigin}${ROUTE_PREFIX}`

/**
 * Whether the suite enforces browser semantics - CORS preflights, an origin-scoped cookie jar
 * and `withCredentials`. True for happy-dom as well as real browsers, so that the tests which
 * only make sense under those rules still run there.
 */
export const hasBrowserSemantics = suite === 'browser' || suite === 'happy-dom'

/**
 * `EventSource` options every test in the suite starts from.
 *
 * The server-side runtimes get an explicitly injected `fetch`, which is what the `fetch` option
 * exists for. The browser-like suites deliberately pass nothing and let `EventSource` fall back
 * to its own default, because browsers reject a `globalThis.fetch` invoked without its original
 * receiver. Spread it rather than setting `fetch` to `undefined`, which `exactOptionalPropertyTypes`
 * rightly rejects: absent and "present but undefined" are not the same thing here.
 */
export const esInit: {fetch?: FetchLike} = hasBrowserSemantics ? {} : {fetch: globalThis.fetch}

/** Unconditional `fetch`, for the assertions and custom `fetch` options that call the server. */
export const request: typeof globalThis.fetch = (...args) => globalThis.fetch(...args)

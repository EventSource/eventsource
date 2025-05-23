# Migration guide

## v3 to v4

### Runtime support

Dropped support for Node.js version 18, as it is no longer maintained. While
there are no explicit changes that makes it incompatible, we make no guarantees of it being supported going forward.

### Code changes

#### Dropped `FetchLikeInit` type

If you're using TypeScript, `FetchLikeInit` is now called `EventSourceFetchInit` and
most of it's properties are now marked as required - since they will always be passed
from the EventSource library to your custom `fetch` method. This makes it easier to use.

## v2 to v3

### Code changes

#### Named export

The module now uses named exports instead of a default export. This means you need to change your import statements from:

**ESM:**

```diff
-import EventSource from 'eventsource'
import {EventSource} from 'eventsource'
```

**CommonJS:**

```diff
-const EventSource = require('eventsource')
const {EventSource} = require('eventsource')
```

#### UMD bundle dropped

If you were previously importing/using the `eventsource-polyfill.js` file/module, you should instead use a bundler like Vite, Rollup or similar. You can theoretically also use something like [esm.sh](https://esm.sh/) to load the module directly in the browser - eg:

```ts
import {EventSource} from 'https://esm.sh/eventsource@3.0.0-beta.0'
```

#### Custom headers dropped

In v2 you could specify custom headers through the `headers` property in the options/init object to the constructor. In v3, the same can be achieved by passing a custom `fetch` function:

```diff
const es = new EventSource('https://my-server.com/sse', {
-  headers: {Authorization: 'Bearer foobar'}
+  fetch: (input, init) => fetch(input, {
+    ...init,
+    headers: {...init.headers, Authorization: 'Bearer foobar'},
+  }),
})
```

#### HTTP/HTTPS proxy dropped

Use a package like [`undici`](https://github.com/nodejs/undici) to add proxy support, either through environment variables or explicit configuration.

```ts
// npm install undici --save
import {fetch, EnvHttpProxyAgent} from 'undici'

const proxyAgent = new EnvHttpProxyAgent()

const es = new EventSource('https://my-server.com/sse', {
  fetch: (input, init) => fetch(input, {...init, dispatcher: proxyAgent}),
})
```

#### Custom HTTPS/connection options dropped

Use a package like [`undici`](https://github.com/nodejs/undici) for more control of fetch options through the use of an [`Agent`](https://undici.nodejs.org/#/docs/api/Agent.md).

```ts
// npm install undici --save
import {fetch, Agent} from 'undici'

const unsafeAgent = new Agent({
  connect: {
    rejectUnauthorized: false,
  },
})

await fetch('https://my-server.com/sse', {
  dispatcher: unsafeAgent,
})
```

### Behavior changes

#### New default reconnect timeout

The default reconnect timeout is now 3 seconds - up from 1 second in v1/v2. This aligns better with browsers (Chrome and Safari, Firefox uses 5 seconds). Servers are (as always) free to set their own reconnect timeout through the `retry` field.

#### Redirect handling

Redirect handling now matches Chrome/Safari. On disconnects, we will always reconnect to the _original_ URL. In v1/v2, only HTTP 307 would reconnect to the original, while 301 and 302 would both redirect to the _destination_.

While the _ideal_ behavior would be for 301 and 308 to reconnect to the redirect _destination_, and 302/307 to reconnect to the _original_ URL, this is not possible to do cross-platform (cross-origin requests in browsers do not allow reading location headers, and redirect handling will have to be done manually).

#### Strict checking of Content-Type header

The `Content-Type` header is now checked. It's value must be `text/event-stream` (or
`text/event-stream; charset=utf-8`), and the connection will be failed otherwise.

To maintain the previous behaviour, you can use the `fetch` option to override the
returned `Content-Type` header if your server does not send the required header:

```ts
const es = new EventSource('https://my-server.com/sse', {
  fetch: async (input, init) => {
    const response = await fetch(input, init)

    if (response.headers.get('content-type').startsWith('text/event-stream')) {
      // Valid header, forward response
      return response
    }

    // Server did not respond with the correct content-type - override it
    const newHeaders = new Headers(response.headers)
    newHeaders.set('content-type', 'text/event-stream')
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    })
  },
})
```

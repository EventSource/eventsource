import {createHash} from 'node:crypto'
import {createReadStream} from 'node:fs'
import {
  createServer,
  type IncomingMessage,
  type OutgoingHttpHeaders,
  type Server,
  type ServerResponse,
} from 'node:http'
import {dirname, resolve as resolvePath} from 'node:path'
import {fileURLToPath} from 'node:url'

import esbuild from 'esbuild'
import {encode} from 'eventsource-encoder'

import {unicodeLines} from './fixtures.js'

const isDeno = typeof globalThis.Deno !== 'undefined'
/* {[client id]: number of connects} */
const connectCounts = new Map<string, number>()

export async function getServer(port: number): Promise<{close: () => Promise<void>}> {
  const server = await promServer(port)

  const closeServer = () =>
    new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()))
    })

  return {
    close: closeServer,
  }

  function promServer(portNumber: number) {
    return new Promise<Server>((resolve, reject) => {
      const srv = createServer(onRequest)
        .on('error', reject)
        .listen(portNumber, isDeno ? '127.0.0.1' : '::', () => resolve(srv))
    })
  }
}

function onRequest(req: IncomingMessage, res: ServerResponse) {
  // Disable Nagle's algorithm for testing
  if (res.socket && 'setNoDelay' in res.socket) {
    res.socket.setNoDelay(true)
  }

  const path = new URL(req.url || '/', 'http://localhost').pathname
  switch (path) {
    // Server-Sent Event endpoints
    case '/':
      return writeDefault(req, res)
    case '/counter':
      return writeCounter(req, res)
    case '/identified':
      return writeIdentifiedListeners(req, res)
    case '/end-after-one':
      return writeOne(req, res)
    case '/slow-connect':
      return writeSlowConnect(req, res)
    case '/debug':
      return writeDebug(req, res)
    case '/set-cookie':
      return writeCookies(req, res)
    case '/authed':
      return writeAuthed(req, res)
    case '/cors':
      return writeCors(req, res)
    case '/stalled':
      return writeStalledConnection(req, res)
    case '/trickle':
      return writeTricklingConnection(req, res)
    case '/unicode':
      return writeUnicode(req, res)
    case '/redirect':
      return writeRedirect(req, res)
    case '/redirect-target':
      return writeRedirectTarget(req, res)

    // Browser test endpoints (HTML/JS)
    case '/browser-test':
      return writeBrowserTestPage(req, res)
    case '/browser-test.js':
      return writeBrowserTestScript(req, res)

    // Fallback, eg 404
    default:
      return writeFallback(req, res)
  }
}

function writeDefault(_req: IncomingMessage, res: ServerResponse) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  })

  tryWrite(
    res,
    encode({
      event: 'welcome',
      data: 'Hello, world!',
    }),
  )

  // For some reason, Bun seems to need this to flush
  tryWrite(res, ':\n')
}

/**
 * Writes 3 messages, then closes connection.
 * Picks up event ID and continues from there.
 */
async function writeCounter(req: IncomingMessage, res: ServerResponse) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  })

  const event = new URL(req.url || '/', 'http://localhost').searchParams.get('event')

  tryWrite(res, encode({retry: 50, data: ''}))

  let counter = parseInt(getLastEventId(req) || '0', 10)
  for (let i = 0; i < 3; i++) {
    counter++
    tryWrite(
      res,
      encode({
        ...(event === '' ? {} : {event: event || 'counter'}),
        data: `Counter is at ${counter}`,
        id: `${counter}`,
      }),
    )
    await delay(5)
  }

  res.end()
}

async function writeIdentifiedListeners(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url || '/', 'http://localhost')
  const clientId = url.searchParams.get('client-id')
  if (!clientId) {
    res.writeHead(400, {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    })
    tryWrite(res, JSON.stringify({error: 'Missing "id" or "client-id" query parameter'}))
    res.end()
    return
  }

  // SSE endpoint, tracks how many listeners have connected with a given client ID
  if ((req.headers.accept || '').includes('text/event-stream')) {
    connectCounts.set(clientId, (connectCounts.get(clientId) || 0) + 1)

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    })
    tryWrite(res, encode({data: '', retry: 250}))
    tryWrite(res, encode({data: `${connectCounts.get(clientId)}`}))

    if (url.searchParams.get('auto-close')) {
      res.end()
    }

    return
  }

  // JSON endpoint, returns the number of connects for a given client ID
  res.writeHead(200, {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache',
  })
  tryWrite(res, JSON.stringify({clientIdConnects: connectCounts.get(clientId) ?? 0}))
  res.end()
}

function writeOne(req: IncomingMessage, res: ServerResponse) {
  const last = getLastEventId(req)
  res.writeHead(last ? 204 : 200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  })

  if (!last) {
    tryWrite(res, encode({retry: 50, data: ''}))
    tryWrite(
      res,
      encode({
        event: 'progress',
        data: '100%',
        id: 'prct-100',
      }),
    )
  }

  res.end()
}

async function writeSlowConnect(_req: IncomingMessage, res: ServerResponse) {
  await delay(200)

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  })

  tryWrite(
    res,
    encode({
      event: 'welcome',
      data: 'That was a slow connect, was it not?',
    }),
  )

  res.end()
}

async function writeStalledConnection(req: IncomingMessage, res: ServerResponse) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  })

  const lastId = getLastEventId(req)
  const reconnected = lastId === '1'

  tryWrite(
    res,
    encode({
      id: reconnected ? '2' : '1',
      event: 'welcome',
      data: reconnected
        ? 'Welcome back'
        : 'Connected - now I will sleep for "too long" without sending data',
    }),
  )

  if (reconnected) {
    await delay(250)
    tryWrite(
      res,
      encode({
        id: '3',
        event: 'success',
        data: 'You waited long enough!',
      }),
    )

    res.end()
  }

  // Intentionally not closing on first-connect that never sends data after welcome
}

async function writeUnicode(_req: IncomingMessage, res: ServerResponse) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  })

  tryWrite(
    res,
    encode({
      event: 'welcome',
      data: 'Connected - I will now send some chonks (cuter chunks) with unicode',
    }),
  )

  tryWrite(
    res,
    encode({
      event: 'unicode',
      data: unicodeLines[0],
    }),
  )

  await delay(100)

  // Start of a valid SSE chunk
  tryWrite(res, 'event: unicode\ndata: ')

  // Write "Espen ❤️ Kokos" in two halves:
  // 1st: Espen � [..., 226, 153]
  // 2st: � Kokos [165, 32, ...]
  tryWrite(res, new Uint8Array([69, 115, 112, 101, 110, 32, 226, 153]))

  // Give time to the client to process the first half
  await delay(1000)

  tryWrite(res, new Uint8Array([165, 32, 75, 111, 107, 111, 115]))

  // Closing end of packet
  tryWrite(res, '\n\n\n\n')

  tryWrite(res, encode({event: 'disconnect', data: 'Thanks for listening'}))
  res.end()
}

/* Holds a record of unique IDs and how many times they've been seen on the redirect route */
const redirects = new Map<string, number>()

async function writeRedirect(req: IncomingMessage, res: ServerResponse) {
  const host = req.headers.host && `http://${req.headers.host}`
  const url = new URL(req.url || '/', host || 'http://localhost')
  const id = url.searchParams.get('id')
  if (!id) {
    res.writeHead(400, {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    })
    tryWrite(res, JSON.stringify({error: 'Missing "id" query parameter'}))
    res.end()
    return
  }

  redirects.set(id, (redirects.get(id) || 0) + 1)

  const redirectUrl = url.searchParams.get('code') || '301'
  const cors = url.searchParams.get('cors') === 'true'

  const xOriginUrl = new URL(url)
  xOriginUrl.hostname = url.hostname === 'localhost' ? '127.0.0.1' : 'localhost'

  const status = parseInt(redirectUrl, 10)
  const path = `/redirect-target?from=${encodeURIComponent(url.toString())}&id=${id}`

  res.writeHead(status, {
    'Cache-Control': 'no-cache',
    Location: cors ? `${xOriginUrl.origin}${path}` : path,
    Connection: 'keep-alive',
  })

  res.end()
}

async function writeRedirectTarget(req: IncomingMessage, res: ServerResponse) {
  const host = req.headers.host && `http://${req.headers.host}`
  const url = new URL(req.url || '/', host || 'http://localhost')
  const id = url.searchParams.get('id')
  const origin = req.headers.origin
  const cors: OutgoingHttpHeaders = origin
    ? {'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Credentials': 'true'}
    : {}

  if (req.headers['access-control-request-headers']) {
    cors['Access-Control-Allow-Headers'] = req.headers['access-control-request-headers']
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    ...cors,
  })

  tryWrite(
    res,
    encode({
      retry: 25,
      data: JSON.stringify({
        origin: url.origin,
        from: url.searchParams.get('from'),
        redirects: redirects.get(id || '') || 0,
        auth: req.headers.authorization || null,
      }),
    }),
  )

  // Bun behaves weirdly when transfer-encoding is not chunked, which it automatically
  // does for smaller packets. By trickling out some comments, we hackishly prevent
  // this from happening. Trying to get a reproducible test case for this so I can file
  // a bug report upstream, but working around it for now.
  for (let i = 0; i < 20; i++) {
    await delay(20)
    tryWrite(res, ':\n')
  }

  res.end()
}

async function writeTricklingConnection(_req: IncomingMessage, res: ServerResponse) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  })

  tryWrite(
    res,
    encode({
      event: 'welcome',
      data: 'Connected - now I will keep sending "comments" for a while',
    }),
  )

  for (let i = 0; i < 60; i++) {
    await delay(500)
    tryWrite(res, ':\n')
  }

  tryWrite(res, encode({event: 'disconnect', data: 'Thanks for listening'}))
  res.end()
}

function writeCors(req: IncomingMessage, res: ServerResponse) {
  const origin = req.headers.origin
  const cors = origin ? {'Access-Control-Allow-Origin': origin} : {}

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    ...cors,
  })

  tryWrite(
    res,
    encode({
      event: 'origin',
      data: origin || '<none>',
    }),
  )

  res.end()
}

async function writeDebug(req: IncomingMessage, res: ServerResponse) {
  const hash = new Promise<string>((resolve, reject) => {
    const bodyHash = createHash('sha256')
    req.on('error', reject)
    req.on('data', (chunk) => bodyHash.update(chunk))
    req.on('end', () => resolve(bodyHash.digest('hex')))
  })

  let bodyHash: string
  try {
    bodyHash = await hash
  } catch (err: unknown) {
    res.writeHead(500, 'Internal Server Error')
    tryWrite(res, err instanceof Error ? err.message : `${err}`)
    res.end()
    return
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  })

  tryWrite(
    res,
    encode({
      event: 'debug',
      data: JSON.stringify({
        method: req.method,
        headers: req.headers,
        bodyHash,
      }),
    }),
  )

  res.end()
}

/**
 * Ideally we'd just set these in the storage state, but Playwright does not seem to
 * be able to for some obscure reason - is not set if passed in page context or through
 * `addCookies()`.
 */
function writeCookies(req: IncomingMessage, res: ServerResponse) {
  res.writeHead(200, {
    'Access-Control-Allow-Origin': req.headers.origin || '*',
    'Access-Control-Allow-Credentials': 'true',
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache',
    'Set-Cookie': 'someSession=someValue; Path=/authed; HttpOnly; SameSite=Lax;',
    Connection: 'keep-alive',
  })
  tryWrite(res, JSON.stringify({cookiesWritten: true}))
  res.end()
}

function writeAuthed(req: IncomingMessage, res: ServerResponse) {
  const headers = {
    'Access-Control-Allow-Origin': req.headers.origin || '*',
    'Access-Control-Allow-Credentials': 'true',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  }

  if (req.method === 'OPTIONS') {
    res.writeHead(204, headers)
    res.end()
    return
  }

  res.writeHead(200, {...headers, 'content-type': 'text/event-stream'})

  tryWrite(
    res,
    encode({
      event: 'authInfo',
      data: JSON.stringify({cookies: req.headers.cookie || ''}),
    }),
  )

  res.end()
}

function writeFallback(_req: IncomingMessage, res: ServerResponse) {
  res.writeHead(404, {
    'Content-Type': 'text/plain',
    'Cache-Control': 'no-cache',
    Connection: 'close',
  })

  tryWrite(res, 'File not found')
  res.end()
}

function writeBrowserTestPage(_req: IncomingMessage, res: ServerResponse) {
  res.writeHead(200, {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-cache',
    Connection: 'close',
  })

  const thisDir = dirname(fileURLToPath(import.meta.url))
  createReadStream(resolvePath(thisDir, './browser/browser-test.html')).pipe(res)
}

async function writeBrowserTestScript(_req: IncomingMessage, res: ServerResponse) {
  res.writeHead(200, {
    'Content-Type': 'text/javascript; charset=utf-8',
    'Cache-Control': 'no-cache',
    Connection: 'close',
  })

  const thisDir = dirname(fileURLToPath(import.meta.url))
  const build = await esbuild.build({
    bundle: true,
    target: ['chrome71', 'edge79', 'firefox105', 'safari14.1'],
    entryPoints: [resolvePath(thisDir, './browser/browser-test.ts')],
    sourcemap: 'inline',
    write: false,
    outdir: 'out',
  })

  tryWrite(res, build.outputFiles.map((file) => file.text).join('\n\n'))
  res.end()
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function getLastEventId(req: IncomingMessage): string | undefined {
  const lastId = req.headers['last-event-id']
  return typeof lastId === 'string' ? lastId : undefined
}

function tryWrite(res: ServerResponse, chunk: string | Uint8Array) {
  try {
    res.write(chunk)
  } catch (err: unknown) {
    // Deno/Bun sometimes throws on write after close
    if (err instanceof TypeError && err.message.includes('cannot close or enqueue')) {
      return
    }

    if (err instanceof Error && err.message.includes('Stream already ended')) {
      return
    }

    throw err
  }
}

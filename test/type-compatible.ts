/**
 * Ensures that our EventSource polyfill is as type-compatible as possible with the
 * WhatWG EventSource implementation/types (defined in TypeScript's `lib.dom.d.ts`).
 */
import {EventSource as EventSourcePolyfill} from '../src/EventSource'

function testESImpl(EvtSource: typeof globalThis.EventSource | typeof EventSourcePolyfill) {
  const es = new EvtSource('https://foo.bar', {
    withCredentials: true,
  }) satisfies globalThis.EventSource

  /* eslint-disable no-console */

  // Message
  es.onmessage = function (evt) {
    console.log(typeof evt.data === 'string')
    console.log(evt.defaultPrevented === false)
    console.log(evt.type === 'message')
    console.log(this === es)
  }

  function onMessage(evt: MessageEvent) {
    console.log(typeof evt.data === 'string')
    console.log(evt.defaultPrevented === false)
    console.log(evt.type === 'message')
    console.log(this === es)
  }

  es.addEventListener('message', onMessage)
  es.removeEventListener('message', onMessage)

  // Error
  es.onerror = function (event) {
    console.log(event.defaultPrevented === false)
    console.log(event.type === 'error')
    console.log(this === es)
  }

  function onError(event: Event) {
    console.log(event.defaultPrevented === false)
    console.log(event.type === 'error')
    console.log(this === es)
  }

  es.addEventListener('error', onError)
  es.removeEventListener('error', onError)

  // Open
  es.onopen = function (event) {
    console.log(event.defaultPrevented === false)
    console.log(event.type === 'open')
    console.log(this === es)
  }

  function onOpen(event: Event) {
    console.log(event.defaultPrevented === false)
    console.log(event.type === 'open')
    console.log(this === es)
  }

  es.addEventListener('open', onOpen)
  es.removeEventListener('open', onOpen)

  // Properties
  console.log(es.readyState === 0 || es.readyState === 1 || es.readyState === 2)
  console.log(es.url === 'https://foo.bar')
  console.log(es.withCredentials === true)

  console.log(es.CLOSED === 2)
  console.log(es.OPEN === 1)
  console.log(es.CONNECTING === 0)

  // Methods
  es.close()
}

testESImpl(EventSourcePolyfill)
testESImpl(globalThis.EventSource)

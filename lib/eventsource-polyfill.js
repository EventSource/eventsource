var EventSource = require('./eventsource')
if (typeof window === 'object') {
  window.EventSourcePolyfill = EventSource
  if (!window.EventSource) window.EventSource = EventSource
}

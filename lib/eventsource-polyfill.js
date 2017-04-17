window.EventSourcePolyfill = require('./eventsource')
window.EventSource = window.EventSource || window.EventSourcePolyfill

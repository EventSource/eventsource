var http = require('http')
  , util = require('util')
  , events = require('events')
  , parser = require('./parser');

/**
 * Creates a new EventSource object
 *
 * @param {String} url the URL to which to connect
 * @api public
 **/
function EventSource(url) {
    var self = this;
    var options = require('url').parse(url);

    var req = http.request(options, function(res) {
        var buf = '';
        res.on('data', function (chunk) {
            buf = buf + chunk;
            var messages = buf.match(/(.|\r?\n)*\n\n/)
            if (!messages) return;
            messages = messages[0];
            buf = buf.slice(messages.length);
            parser.parse(messages).forEach(function(message) {
                if (message.event || message.data) {
                    var data = message.data.replace(/\n$/, '');
                    self.emit(message.event || 'message', new MessageEvent(data));
                }
            });
        });
    });

    req.end();
}

module.exports = EventSource;

util.inherits(EventSource, events.EventEmitter);
EventSource.prototype.constructor = EventSource; // make stacktraces readable

['open', 'error', 'message'].forEach(function(method) {
    Object.defineProperty(EventSource.prototype, 'on' + method, {
        /**
         * Returns the current listener
         *
         * @return {Mixed} the set function or undefined
         * @api private
         */
        get: function get() {
            var listener = this.listeners(method)[0];
            return listener ? (listener._listener ? listener._listener : listener) : undefined;
        },

        /**
         * Start listening for events
         *
         * @param {Function} listener the listener
         * @return {Mixed} the set function or undefined
         * @api private
         */
        set: function set(listener) {
            this.removeAllListeners(method);
            this.addEventListener(method, listener);
        }
    });
});

/**
 * Emulates the W3C Browser based WebSocket interface using addEventListener.
 *
 * @param {String} method Listen for an event
 * @param {Function} event callback
 * @see https://developer.mozilla.org/en/DOM/element.addEventListener
 * @see http://dev.w3.org/html5/websockets/#the-websocket-interface
 * @api public
 */
EventSource.prototype.addEventListener = function addEventListener(method, listener) {
    if (typeof listener === 'function') {
        // store a reference so we can return the original function again
        listener._listener = listener;
        this.on(method, listener);
    }
};

/**
 * W3C MessageEvent
 *
 * @see http://www.w3.org/TR/html5/comms.html
 * @api private
 */
function MessageEvent(dataArg) {
    // Currently only the data attribute is implemented. More can be added later if needed.
    Object.defineProperty(this, 'data', { writable: false, value: dataArg });
}


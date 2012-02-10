var http = require('http')
  , util = require('util')
  , events = require('events');

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
            var messages = buf.split(/\n\n/);
            while(messages.length > 1) {
                var message = messages.splice(0, 1)[0];
                data = message.replace(/^data:\s*/mg, '');
                self.emit('message', new MessageEvent(data));
            }
            buf = messages[0];
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


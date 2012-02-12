var http = require('http')
  , https =require('https')
  , util = require('util')
  , events = require('events')
  , eventstream = require('./eventstream');

/**
 * Creates a new EventSource object
 *
 * @param {String} url the URL to which to connect
 * @api public
 **/
function EventSource(url) {
    var readyState = EventSource.CONNECTING;
    Object.defineProperty(this, 'readyState', {
        get: function() {
          return readyState;
        }
    });

    Object.defineProperty(this, 'url', {
        get: function() {
          return url;
        }
    });

    var self = this;
    self.reconnectInterval = 1000;
    var options = require('url').parse(url);
    var isSecure = options.protocol == 'https:';

    var closedByMe = false;
    function onConnectionClosed() {
        if (readyState == EventSource.CLOSED) return;
        readyState = EventSource.CLOSED;
        if (closedByMe) return _emit('close');
        _emit('error');
        setTimeout(connect, self.reconnectInterval);
    }

    var lastEventId = '';
    var req;
    function connect() {
        readyState = EventSource.CONNECTING;

        options.headers = {
            'Cache-Control': 'no-cache'
        };
        if (lastEventId) options.headers['last-event-id'] = lastEventId;

        req = (isSecure ? https : http).request(options, function(res) {
            readyState = EventSource.OPEN;
            _emit('open');

            var buf = '';
            res.on('data', function (chunk) {
                buf = buf + chunk;
                var messages = buf.match(/(.|\r\n|\n|\r)*(\n\n|\r\r|\r\n\r\n)/);
                if (!messages) return;
                messages = messages[0];
                buf = buf.slice(messages.length);
                messages = eventstream.parse(messages);
                if (!messages) return;
                messages.forEach(function(message) {
                    var data = message.data.replace(/\n$/, '');
                    if (data == '' || (message.event != null && message.event == '')) {
                        return;
                    }
                    if (message.id) lastEventId = message.id;
                    _emit(message.event || 'message', new MessageEvent(data));
                });
            });

            res.on('close', onConnectionClosed);
            res.on('end', onConnectionClosed);
        });

        req.on('error', onConnectionClosed);
        req.setNoDelay(true);
        req.end();
    }
    connect();

    function _emit() {
        if(self.listeners(arguments[0]).length > 0) {
            self.emit.apply(self, arguments);
        }
    }

    this.close = function() {
        closedByMe = true;
        req.abort();
    }
}

module.exports = EventSource;

util.inherits(EventSource, events.EventEmitter);
EventSource.prototype.constructor = EventSource; // make stacktraces readable

['open', 'close', 'error', 'message'].forEach(function(method) {
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
 * Ready states
 */
Object.defineProperty(EventSource, 'CONNECTING', { enumerable: true, value: 0});
Object.defineProperty(EventSource, 'OPEN', { enumerable: true, value: 1});
Object.defineProperty(EventSource, 'CLOSED', { enumerable: true, value: 2});


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


var http = require('http');

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
                message = message.replace(/^data:\s*/mg, '');
                if(self.onmessage) {
                    try {
                        self.onmessage({data:message});
                    } catch(e) {
                        console.log('*** ERROR', e);
                    }
                }
            }
            buf = messages[0];
        });
    });

    req.end();
}

EventSource.prototype.close = function() {
}

module.exports = EventSource;

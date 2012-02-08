var http = require('http');

function EventSource(url) {
	var self = this;

	var options = require('url').parse(url);

	// TODO: FIXME
	options = {
		host: 'localhost',
		port: options.port,
		path: '/',
		method: 'GET'
	};

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

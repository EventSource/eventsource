var http = require('http');
var EventSource = require('es');

var port = 20000;
function createServer(data, callback) {
    var responses = [];
    var server = http.createServer(function (req, res) {
        res.writeHead(200, {'Content-Type': 'text/event-stream'});
        res.write(data);
        responses.push(res);
    });
    function close() {
        responses.forEach(function(res) {
            res.end();
        });
        server.close();
    }
    var p = port++;
    server.listen(p, function() {
        var es = new EventSource('http://localhost:' + p);
        callback(es, close);
    });
}

exports['Messages'] = {
    'one-line simple message in one chunk': function(test) {
        createServer("data: Hello\n\n", function(es, close) {
            es.onmessage = function(m) {
                test.equal("Hello", m.data);
                close();
                test.done();
            };
        });
    }
};

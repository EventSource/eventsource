var http = require('http');
var EventSource = require('es');

var port = 20000;
function createServer(chunks, callback) {
    var responses = [];
    var server = http.createServer(function (req, res) {
        res.writeHead(200, {'Content-Type': 'text/event-stream'});
        chunks.forEach(function(chunk) {
            res.write(chunk);
        });
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
    'one one-line message in one chunk': function(test) {
        createServer(["data: Hello\n\n"], function(es, close) {
            es.onmessage = function(m) {
                test.equal("Hello", m.data);
                close();
                test.done();
            };
        });
    },

    'one one-line message in two chunks': function(test) {
        createServer(["data: Hel", "lo\n\n"], function(es, close) {
            es.onmessage = function(m) {
                test.equal("Hello", m.data);
                close();
                test.done();
            };
        });
    },

    'two one-line messages in one chunk': function(test) {
        createServer(["data: Hello\n\n", "data: World\n\n"], function(es, close) {
            es.onmessage = first;

            function first(m) {
                test.equal("Hello", m.data);
                es.onmessage = second;
            }

            function second(m) {
                test.equal("World", m.data);
                close();
                test.done();
            }
        });
    }
};

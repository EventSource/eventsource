var http = require('http');
var EventSource = require('eventsource');

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
    server.listen(port, function() {
        var es = new EventSource('http://localhost:' + port);
        callback(es, close);
    });
}

exports['Messages'] = {
    setUp: function(done) {
        port++;
        done();
    },
  
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
    },

    'one two-line message in one chunk': function(test) {
        createServer(["data: Hello\ndata:World\n\n"], function(es, close) {
            es.onmessage = function(m) {
                test.equal("Hello\nWorld", m.data);
                close();
                test.done();
            };
        });
    },

    'really chopped up unicode data': function(test) {
        var chopped = "data: Aslak\n\ndata: Hellesøy\n\n".split("");
        createServer(chopped, function(es, close) {
            es.onmessage = first;

            function first(m) {
                test.equal("Aslak", m.data);
                es.onmessage = second;
            }

            function second(m) {
                test.equal("Hellesøy", m.data);
                close();
                test.done();
            }
        });
    },

    'delivers message with explicit event': function(test) {
        createServer(["event: greeting\ndata: Hello\n\n"], function(es, close) {
            es.addEventListener('greeting', function(m) {
                test.equal("Hello", m.data);
                close();
                test.done();
            });
        });
    },

    'comments are ignored': function(test) {
        createServer(["data: Hello\n\n:nothing to see here\n\ndata: World\n\n"], function(es, close) {
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

exports['Reconnect'] = {
      'when server is down': function(test) {
        var es = new EventSource('http://localhost:' + port);
        es.reconnectInterval = 0;
        var theClose = null;
        es.onmessage = function(m) {
            test.equal("Hello", m.data);
            theClose();
            test.done();
        };

        es.onerror = function() {
            createServer(["data: Hello\n\n"], function(_, close) {
                theClose = close;
            });
        };
    }
};


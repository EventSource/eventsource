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
    function close(closed) {
        responses.forEach(function(res) {
            res.end();
        });
        server.on('close', closed);
        server.close();
    }
    server.listen(port, function() {
        callback(close);
    });
};

exports['Messages'] = {
    setUp: function(done) {
        port++;
        done();
    },
  
    'one one-line message in one chunk': function(test) {
        createServer(["data: Hello\n\n"], function(close) {
            var es = new EventSource('http://localhost:' + port);
            es.onmessage = function(m) {
                test.equal("Hello", m.data);
                es.close();
                close(test.done);
            };
        });
    },

    'one one-line message in two chunks': function(test) {
        createServer(["data: Hel", "lo\n\n"], function(close) {
            var es = new EventSource('http://localhost:' + port);
            es.onmessage = function(m) {
                test.equal("Hello", m.data);
                es.close();
                close(test.done);
            };
        });
    },

    'two one-line messages in one chunk': function(test) {
        createServer(["data: Hello\n\n", "data: World\n\n"], function(close) {
            var es = new EventSource('http://localhost:' + port);
            es.onmessage = first;

            function first(m) {
                test.equal("Hello", m.data);
                es.onmessage = second;
            }

            function second(m) {
                test.equal("World", m.data);
                es.close();
                close(test.done);
            }
        });
    },

    'one two-line message in one chunk': function(test) {
        createServer(["data: Hello\ndata:World\n\n"], function(close) {
            var es = new EventSource('http://localhost:' + port);
            es.onmessage = function(m) {
                test.equal("Hello\nWorld", m.data);
                es.close();
                close(test.done);
            };
        });
    },

    'really chopped up unicode data': function(test) {
        var chopped = "data: Aslak\n\ndata: Hellesøy\n\n".split("");
        createServer(chopped, function(close) {
            var es = new EventSource('http://localhost:' + port);
            es.onmessage = first;

            function first(m) {
                test.equal("Aslak", m.data);
                es.onmessage = second;
            }

            function second(m) {
                test.equal("Hellesøy", m.data);
                es.close();
                close(test.done);
            }
        });
    },

    'delivers message with explicit event': function(test) {
        createServer(["event: greeting\ndata: Hello\n\n"], function(close) {
            var es = new EventSource('http://localhost:' + port);
            es.addEventListener('greeting', function(m) {
                test.equal("Hello", m.data);
                es.close();
                close(test.done);
            });
        });
    },

    'comments are ignored': function(test) {
        createServer(["data: Hello\n\n:nothing to see here\n\ndata: World\n\n"], function(close) {
            var es = new EventSource('http://localhost:' + port);
            es.onmessage = first;

            function first(m) {
                test.equal("Hello", m.data);
                es.onmessage = second;
            }

            function second(m) {
                test.equal("World", m.data);
                es.close();
                close(test.done);
            }
        });
    }
};

exports['Reconnect'] = {
    setUp: function(done) {
        port++;
        done();
    },

    'when server is down': function(test) {
        var es = new EventSource('http://localhost:' + port);
        es.reconnectInterval = 0;
        var theClose = null;

        es.onerror = function(source) {
            es.onerror = null;
            createServer(["data: Hello\n\n"], function(close) {
                theClose = close;
            });
        };

        es.onmessage = function(m) {
            test.equal("Hello", m.data);
            es.close();
            theClose(test.done);
        };
    },

    'when server goes down after connection': function(test) {
        createServer(["data: Hello\n\n"], function(closeFirstServer) {
            var es = new EventSource('http://localhost:' + port);
            es.reconnectInterval = 0;

            es.onmessage = function(m) {
                test.equal("Hello", m.data);
                closeFirstServer(function() {
                    createServer(["data: World\n\n"], function(closeSecondServer) {
                        es.onmessage = second;

                        function second(m) {
                            test.equal("World", m.data);
                            es.close();
                            closeSecondServer(test.done);
                        }
                    });
                });
            };
        });
    }
};


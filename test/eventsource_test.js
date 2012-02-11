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
        res.end();
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

    'accepts CRLF as separator': function(test) {
        var chopped = "data: Aslak\r\n\r\ndata: Hellesøy\r\n\r\n".split("");
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

    'accepts CR as separator': function(test) {
        var chopped = "data: Aslak\r\rdata: Hellesøy\r\r".split("");
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
    },

    'empty comments are ignored': function(test) {
        createServer(["data: Hello\n\n:\n\ndata: World\n\n"], function(close) {
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

    'empty data field causes entire event to be ignored': function(test) {
        createServer(["data:\n\ndata: Hello\n\n"], function(close) {
            var es = new EventSource('http://localhost:' + port);
            var originalEmit = es.emit;
            es.emit = function(event) {
                test.ok(event === 'close' || event === 'message' || event === 'newListener');
                return originalEmit.apply(this, arguments);
            }
            es.onmessage = function(m) {
                test.equal('Hello', m.data);
                es.close();
                close(test.done);
            };
        });
    },

    'empty event field causes entire event to be ignored': function(test) {
        createServer(["event:\n\ndata: Hello\n\n"], function(close) {
            var es = new EventSource('http://localhost:' + port);
            var originalEmit = es.emit;
            es.emit = function(event) {
                test.ok(event === 'close' || event === 'message' || event === 'newListener');
                return originalEmit.apply(this, arguments);
            }
            es.onmessage = function(m) {
                test.equal('Hello', m.data);
                es.close();
                close(test.done);
            };
        });
    },
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

exports['readyState'] = {
    'has CONNECTING constant': function(test) {
        test.equal(0, EventSource.CONNECTING);
        test.done();
    },

    'has OPEN constant': function(test) {
        test.equal(1, EventSource.OPEN);
        test.done();
    },

    'has CLOSED constant': function(test) {
        test.equal(2, EventSource.CLOSED);
        test.done();
    },

    'readyState is CONNECTING before connection has been established': function(test) {
        createServer([], function(close) {
            var es = new EventSource('http://localhost:' + port);
            test.equal(EventSource.CONNECTING, es.readyState);
            es.onopen = function() {
                es.close();
                close(test.done);
            }
        });
    },

    'readyState is OPEN when connection has been established': function(test) {
        createServer([], function(close) {
            var es = new EventSource('http://localhost:' + port);
            es.onopen = function() {
                test.equal(EventSource.OPEN, es.readyState);
                es.close();
                close(test.done);
            }
        });
    },

    'readyState is CLOSED after connection has been closed': function(test) {
        createServer([], function(close) {
            var es = new EventSource('http://localhost:' + port);
            es.onopen = function() {
                es.close();
            }
            es.onclose = function() {
                test.equal(EventSource.CLOSED, es.readyState);
                close(test.done);
            }
        });
    },
};

exports['Events'] = {
    setUp: function(done) {
        port++;
        done();
    },

    'calls onopen when connection is established': function(test) {
        createServer([], function(close) {
            var es = new EventSource('http://localhost:' + port);
            es.onopen = function() {
                es.close();
                close(test.done);
            }
        });
    },

    'emits open event when connection is established': function(test) {
        createServer([], function(close) {
            var es = new EventSource('http://localhost:' + port);
            es.addEventListener('open', function() {
                es.close();
                close(test.done);
            });
        });
    },

    'calls onclose when connection is closed': function(test) {
        createServer([], function(close) {
            var es = new EventSource('http://localhost:' + port);
            es.onopen = function() {
                es.close();
            }
            es.onclose = function() {
                close(test.done);
            }
        });
    },

    'emits close event when connection is established': function(test) {
        createServer([], function(close) {
            var es = new EventSource('http://localhost:' + port);
            es.addEventListener('open', function() {
                es.close();
            });
            es.addEventListener('close', function() {
                close(test.done);
            });
        });
    },

    'does not emit error when connection is closed by client': function(test) {
        createServer([], function(close) {
            var es = new EventSource('http://localhost:' + port);
            es.addEventListener('open', function() {
                es.close();
            });
            es.addEventListener('error', function() {
                throw new Error('error should not be emitted');
            });
            es.addEventListener('close', function() {
                close(test.done);
            });
        });
    },
};

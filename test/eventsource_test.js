var EventSource = require('eventsource')
  , http = require('http')
  , https = require('https')
  , fs = require('fs');

var port = 20000;
function createServer(chunks, callback, onreq, secure) {
    var options = {};
    var isSecure = onreq === true || secure === true;
    if (isSecure) {
        options = {
            key: fs.readFileSync(__dirname + '/key.pem'),
            cert: fs.readFileSync(__dirname + '/certificate.pem')
        };
    }
    var responses = [];
    function open(req, res) {
        if (typeof onreq == 'function' && onreq(req, res) === true) return;
        res.writeHead(200, {'Content-Type': 'text/event-stream'});
        chunks.forEach(function(chunk) { res.write(chunk); });
        res.write(':'); // send a dummy comment to ensure that the head is flushed
        responses.push(res);
    }
    function close(closed) {
        responses.forEach(function(res) {
            res.end();
        });
        server.on('close', closed);
        server.close();
    }
    var server;
    if (isSecure) server = https.createServer(options, open);
    else server = http.createServer(open);
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
                test.ok(event === 'message' || event === 'newListener');
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
                test.ok(event === 'message' || event === 'newListener');
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

exports['HTTP Request'] = {
    setUp: function(done) {
        port++;
        done();
    },

    'passes cache-control: no-cache to server': function(test) {
        var headers;
        createServer([], function(close) {
            var url = 'http://localhost:' + port;
            var es = new EventSource(url);
            es.onopen = function() {
                test.equal('no-cache', headers['cache-control']);
                es.close();
                close(test.done);
            };
        }, function(req) { headers = req.headers; });
    },

    'follows http 301 redirect': function(test) {
        var headers;
        var url = 'http://localhost:' + port;
        var redirectSuffix = '/foobar';
        var clientRequestedRedirectUrl = false;
        createServer([],
            function(close) {
                var es = new EventSource(url);
                es.onopen = function() {
                    test.ok(clientRequestedRedirectUrl);
                    test.equal(url + redirectSuffix, es.url);
                    es.close();
                    close(test.done);
                };
            },
            function(req, res) {
                if (req.url != '/') {
                    clientRequestedRedirectUrl = req.url == redirectSuffix;
                    return false;
                }
                res.writeHead(301, 'Moved Permanently', {
                    'Connection': 'Close',
                    'Location': url + redirectSuffix
                });
                res.end();
                return true;
            });
    },

    'http 301 with missing location causes error event': function(test) {
        var headers;
        var url = 'http://localhost:' + port;
        createServer([],
            function(close) {
                var es = new EventSource(url);
                es.onerror = function() {
                    es.close();
                    close(test.done);
                };
            },
            function(req, res) {
                if (req.url != '/') return false;
                res.writeHead(301, 'Moved Permanently', {
                    'Connection': 'Close'
                });
                res.end();
                return true;
            });
    },

    'follows http 307 redirect': function(test) {
        var headers;
        var url = 'http://localhost:' + port;
        var redirectSuffix = '/foobar';
        var clientRequestedRedirectUrl = false;
        createServer([],
            function(close) {
                var es = new EventSource(url);
                es.onopen = function() {
                    test.ok(clientRequestedRedirectUrl);
                    test.equal(url + redirectSuffix, es.url);
                    es.close();
                    close(test.done);
                };
            },
            function(req, res) {
                if (req.url != '/') {
                    clientRequestedRedirectUrl = req.url == redirectSuffix;
                    return false;
                }
                res.writeHead(307, 'Temporary Redirect', {
                    'Connection': 'Close',
                    'Location': url + redirectSuffix
                });
                res.end();
                return true;
            });
    },

    'http 307 with missing location causes error event': function(test) {
        var headers;
        var url = 'http://localhost:' + port;
        createServer([],
            function(close) {
                var es = new EventSource(url);
                es.onerror = function() {
                    es.close();
                    close(test.done);
                };
            },
            function(req, res) {
                if (req.url != '/') return false;
                res.writeHead(307, 'Temporary Redirect', {
                    'Connection': 'Close'
                });
                res.end();
                return true;
            }
        );
    }
};

exports['HTTPS Support'] = {
    setUp: function(done) {
        port++;
        done();
    },

    'uses https for https urls': function(test) {
        var chopped = "data: Aslak\n\ndata: Hellesøy\n\n".split("");
        createServer(chopped, function(close) {
            var es = new EventSource('https://localhost:' + port);
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
        }, true);
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
    },

    'stop reconnecting when server responds with HTTP 204': function(test) {
        createServer(["data: Hello\n\n"], function(closeFirstServer) {
            var es = new EventSource('http://localhost:' + port);
            es.reconnectInterval = 0;

            es.onmessage = function(m) {
                test.equal("Hello", m.data);
                closeFirstServer(function() {
                    createServer([], function(closeSecondServer) {
                        // this will be verified by the readyState
                        // going from CONNECTING to CLOSED,
                        // along with the tests verifying that the
                        // state is CONNECTING when a server closes.
                        // it's next to impossible to write a fail-safe
                        // test for this, though.
                        var ival = setInterval(function() {
                            if (es.readyState == EventSource.CLOSED) {
                                clearInterval(ival);
                                closeSecondServer(test.done);
                            }
                        }, 5);
                    }, function(req, res) { res.writeHead(204); res.end(); return true; });
                });
            };
        });
    },

    'send Last-Event-ID http header when id has previously been passed in an event from the server': function(test) {
        createServer(['id: 10\ndata: Hello\n\n'], function(closeFirstServer) {
            var headers = null;
            var es = new EventSource('http://localhost:' + port);
            es.reconnectInterval = 0;

            es.onmessage = function(m) {
                closeFirstServer(function() {
                    createServer([], function(close) {
                        es.onopen = function() {
                            test.equal('10', headers['last-event-id']);
                            es.close();
                            close(test.done);
                        };
                    }, function(req) { headers = req.headers; });
                });
            };
        });
    },

    'does not send Last-Event-ID http header when id has not been previously sent by the server': function(test) {
        createServer(['data: Hello\n\n'], function(closeFirstServer) {
            var headers = null;
            var es = new EventSource('http://localhost:' + port);
            es.reconnectInterval = 0;

            es.onmessage = function(m) {
                closeFirstServer(function() {
                    createServer([], function(close) {
                        es.onopen = function() {
                            test.equal('undefined', typeof headers['last-event-id']);
                            es.close();
                            close(test.done);
                        };
                    }, function(req) { headers = req.headers; });
                });
            };
        });
    },

    'reconnect after http 301 redirect uses new url': function(test) {
        var headers;
        var url = 'http://localhost:' + port;
        var redirectSuffix = '/foobar';
        createServer(['data: Hello\n\n'],
            function(closeFirstServer) {
                var es = new EventSource(url);
                es.reconnectInterval = 0;

                es.onmessage = function(m) {
                    closeFirstServer(function() {
                        createServer([], function(closeSecondServer) {
                            es.onopen = function() {
                                test.equal(url + redirectSuffix, es.url);
                                es.close();
                                closeSecondServer(test.done);
                            };
                        }, function(req, res) { test.equal(redirectSuffix, req.url); });
                    });
                };
            },
            function(req, res) {
                if (req.url != '/') return false;
                res.writeHead(301, 'Moved Permanently', {
                    'Connection': 'Close',
                    'Location': url + redirectSuffix
                });
                res.end();
                return true;
            });
    },

    'reconnect after http 307 redirect uses original url': function(test) {
        var headers;
        var url = 'http://localhost:' + port;
        var redirectSuffix = '/foobar';
        createServer(['data: Hello\n\n'],
            function(closeFirstServer) {
                var es = new EventSource(url);
                es.reconnectInterval = 0;

                es.onmessage = function(m) {
                    closeFirstServer(function() {
                        createServer([], function(closeSecondServer) {
                            es.onopen = function() {
                                test.equal(url, es.url);
                                es.close();
                                closeSecondServer(test.done);
                            };
                        }, function(req, res) { test.equal('/', req.url); });
                    });
                };
            },
            function(req, res) {
                if (req.url != '/') return false;
                res.writeHead(307, 'Temporary Redirect', {
                    'Connection': 'Close',
                    'Location': url + redirectSuffix
                });
                res.end();
                return true;
            });
    },
};

exports['readyState'] = {
    setUp: function(done) {
        port++;
        done();
    },

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

    'readyState is CONNECTING when server has closed the connection': function(test) {
        createServer(["data: Hello\n\n"], function(closeFirstServer) {
            var es = new EventSource('http://localhost:' + port);
            es.reconnectInterval = 0;

            es.onmessage = function(m) {
                test.equal("Hello", m.data);
                closeFirstServer(function() {
                    createServer([], function(closeSecondServer) {
                        test.equal(EventSource.CONNECTING, es.readyState);
                        es.close();
                        closeSecondServer(test.done);
                    });
                });
            };
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
                test.equal(EventSource.CLOSED, es.readyState);
                close(test.done);
            };
        });
    },
};

exports['Properties'] = {
    setUp: function(done) {
        port++;
        done();
    },

    'url exposes original request url': function(test) {
        createServer([], function(close) {
            var url = 'http://localhost:' + port;
            var es = new EventSource(url);
            es.onopen = function() {
                test.equal(url, es.url);
                es.close();
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

    'does not emit error when connection is closed by client': function(test) {
        createServer([], function(close) {
            var es = new EventSource('http://localhost:' + port);
            es.addEventListener('open', function() {
                es.close();
                setTimeout(function() {
                    close(test.done);
                }, 50);
            });
            es.addEventListener('error', function() {
                throw new Error('error should not be emitted');
            });
        });
    },
};

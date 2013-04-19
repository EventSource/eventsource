var EventSource = require('../lib/eventsource')
  , http = require('http')
  , https = require('https')
  , fs = require('fs')
  , assert = require('assert');

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

describe('Parser', function() {
    beforeEach(function(done) {
        port++;
        done();
    });

    it('parses multibyte characters', function(done) {
        createServer(["id: 1\ndata: €豆腐\n\n"], function(close) {
            var es = new EventSource('http://localhost:' + port);
            es.onmessage = function(m) {
                assert.equal("€豆腐", m.data);
                es.close();
                close(done);
            };
        });
    });

    it('raises error when it fails to parse', function(done) {
        createServer(["\n\n\n\nid: 1\ndata: hello world\n\n"], function(close) {
            var es = new EventSource('http://localhost:' + port);
            es.onmessage = function(m) {
                assert.equal("hello world", m.data);
                es.close();
                close(done);
            };
            es.onerror = function(e) {
                es.close();
                close(done);
            };
        });
    });

    it('parses one one-line message in one chunk', function(done) {
        createServer(["data: Hello\n\n"], function(close) {
            var es = new EventSource('http://localhost:' + port);
            es.onmessage = function(m) {
                assert.equal("Hello", m.data);
                es.close();
                close(done);
            };
        });
    });

    it('parses one one-line message in two chunks', function(done) {
        createServer(["data: Hel", "lo\n\n"], function(close) {
            var es = new EventSource('http://localhost:' + port);
            es.onmessage = function(m) {
                assert.equal("Hello", m.data);
                es.close();
                close(done);
            };
        });
    });

    it('parses two one-line messages in one chunk', function(done) {
        createServer(["data: Hello\n\n", "data: World\n\n"], function(close) {
            var es = new EventSource('http://localhost:' + port);
            es.onmessage = first;

            function first(m) {
                assert.equal("Hello", m.data);
                es.onmessage = second;
            }

            function second(m) {
                assert.equal("World", m.data);
                es.close();
                close(done);
            }
        });
    });

    it('parses one two-line message in one chunk', function(done) {
        createServer(["data: Hello\ndata:World\n\n"], function(close) {
            var es = new EventSource('http://localhost:' + port);
            es.onmessage = function(m) {
                assert.equal("Hello\nWorld", m.data);
                es.close();
                close(done);
            };
        });
    });

    it('parses really chopped up unicode data', function(done) {
        var chopped = "data: Aslak\n\ndata: Hellesøy\n\n".split("");
        createServer(chopped, function(close) {
            var es = new EventSource('http://localhost:' + port);
            es.onmessage = first;

            function first(m) {
                assert.equal("Aslak", m.data);
                es.onmessage = second;
            }

            function second(m) {
                assert.equal("Hellesøy", m.data);
                es.close();
                close(done);
            }
        });
    });

    it('accepts CRLF as separator', function(done) {
        var chopped = "data: Aslak\r\n\r\ndata: Hellesøy\r\n\r\n".split("");
        createServer(chopped, function(close) {
            var es = new EventSource('http://localhost:' + port);
            es.onmessage = first;

            function first(m) {
                assert.equal("Aslak", m.data);
                es.onmessage = second;
            }

            function second(m) {
                assert.equal("Hellesøy", m.data);
                es.close();
                close(done);
            }
        });
    });

    it('accepts CR as separator', function(done) {
        var chopped = "data: Aslak\r\rdata: Hellesøy\r\r".split("");
        createServer(chopped, function(close) {
            var es = new EventSource('http://localhost:' + port);
            es.onmessage = first;

            function first(m) {
                assert.equal("Aslak", m.data);
                es.onmessage = second;
            }

            function second(m) {
                assert.equal("Hellesøy", m.data);
                es.close();
                close(done);
            }
        });
    });

    it('delivers message with explicit event', function(done) {
        createServer(["event: greeting\ndata: Hello\n\n"], function(close) {
            var es = new EventSource('http://localhost:' + port);
            es.addEventListener('greeting', function(m) {
                assert.equal("Hello", m.data);
                es.close();
                close(done);
            });
        });
    });

    it('ignores comments', function(done) {
        createServer(["data: Hello\n\n:nothing to see here\n\ndata: World\n\n"], function(close) {
            var es = new EventSource('http://localhost:' + port);
            es.onmessage = first;

            function first(m) {
                assert.equal("Hello", m.data);
                es.onmessage = second;
            }

            function second(m) {
                assert.equal("World", m.data);
                es.close();
                close(done);
            }
        });
    });

    it('ignores empty comments', function(done) {
        createServer(["data: Hello\n\n:\n\ndata: World\n\n"], function(close) {
            var es = new EventSource('http://localhost:' + port);
            es.onmessage = first;

            function first(m) {
                assert.equal("Hello", m.data);
                es.onmessage = second;
            }

            function second(m) {
                assert.equal("World", m.data);
                es.close();
                close(done);
            }
        });
    });

    it('causes entire event to be ignored for empty data fields', function(done) {
        createServer(["data:\n\ndata: Hello\n\n"], function(close) {
            var es = new EventSource('http://localhost:' + port);
            var originalEmit = es.emit;
            es.emit = function(event) {
                assert.ok(event === 'message' || event === 'newListener');
                return originalEmit.apply(this, arguments);
            }
            es.onmessage = function(m) {
                assert.equal('Hello', m.data);
                es.close();
                close(done);
            };
        });
    });

    it('causes entire event to be ignored for empty event field', function(done) {
        createServer(["event:\n\ndata: Hello\n\n"], function(close) {
            var es = new EventSource('http://localhost:' + port);
            var originalEmit = es.emit;
            es.emit = function(event) {
                assert.ok(event === 'message' || event === 'newListener');
                return originalEmit.apply(this, arguments);
            }
            es.onmessage = function(m) {
                assert.equal('Hello', m.data);
                es.close();
                close(done);
            };
        });
    });
});

describe('HTTP Request', function() {
    beforeEach(function(done) {
        port++;
        done();
    });

    it('passes cache-control: no-cache to server', function(done) {
        var headers;
        createServer([], function(close) {
            var url = 'http://localhost:' + port;
            var es = new EventSource(url);
            es.onopen = function() {
                assert.equal('no-cache', headers['cache-control']);
                es.close();
                close(done);
            };
        }, function(req) { headers = req.headers; });
    });

    it('sets headers by user', function(done) {
        var url = 'http://localhost:' + port;
        var headers = {
          'User-Agent': 'test',
          'Cookie': 'test=test'
        };
        createServer([],
            function(close) {
                var es = new EventSource(url, {headers: headers});
                es.onopen = function() {
                    es.close();
                    close(done);
                };
            },
            function(req, res) {
                assert.equal(req.headers['user-agent'], headers['User-Agent']);
                assert.equal(req.headers['cookie'], headers['Cookie']);
                res.writeHead(200);
                res.end();
                return true;
            });
    });

    it('follows http 301 redirect', function(done) {
        var headers;
        var url = 'http://localhost:' + port;
        var redirectSuffix = '/foobar';
        var clientRequestedRedirectUrl = false;
        createServer([],
            function(close) {
                var es = new EventSource(url);
                es.onopen = function() {
                    assert.ok(clientRequestedRedirectUrl);
                    assert.equal(url + redirectSuffix, es.url);
                    es.close();
                    close(done);
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
    });

    it('causes error event when response is 403', function(done) {
        var headers;
        var url = 'http://localhost:' + port;
        createServer(["id: 1\ndata: hello world\n\n"],
            function(close) {
                var es = new EventSource(url);
                es.onerror = function() {
                    assert.ok(true, 'got error');
                    es.close();
                    close(done);
                };
            },
            function(req, res) {
                res.writeHead(403, {'Content-Type': 'text/html'});
                res.end();
            });
    });

    it('causes error event when response is 301 with missing location', function(done) {
        var headers;
        var url = 'http://localhost:' + port;
        createServer([],
            function(close) {
                var es = new EventSource(url);
                es.onerror = function() {
                    es.close();
                    close(done);
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
    });

    it('follows http 307 redirect', function(done) {
        var headers;
        var url = 'http://localhost:' + port;
        var redirectSuffix = '/foobar';
        var clientRequestedRedirectUrl = false;
        createServer([],
            function(close) {
                var es = new EventSource(url);
                es.onopen = function() {
                    assert.ok(clientRequestedRedirectUrl);
                    assert.equal(url + redirectSuffix, es.url);
                    es.close();
                    close(done);
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
    });

    it('causes error event for 307 response with with missing location', function(done) {
        var headers;
        var url = 'http://localhost:' + port;
        createServer([],
            function(close) {
                var es = new EventSource(url);
                es.onerror = function() {
                    es.close();
                    close(done);
                };
            },
            function(req, res) {
                if (req.url != '/') return false;
                res.writeHead(307, 'Temporary Redirect', {
                    'Connection': 'Close'
                });
                res.end();
                return true;
            });
    });
});

describe('HTTPS Support', function() {
    beforeEach(function(done) {
        port++;
        done();
    });

    it('uses https for https urls', function(done) {
        var chopped = "data: Aslak\n\ndata: Hellesøy\n\n".split("");
        createServer(chopped, function(close) {
            var es = new EventSource('https://localhost:' + port);
            es.onmessage = first;

            function first(m) {
                assert.equal("Aslak", m.data);
                es.onmessage = second;
            }

            function second(m) {
                assert.equal("Hellesøy", m.data);
                es.close();
                close(done);
            }
        }, true);
    });
});

describe('Reconnection', function() {
    beforeEach(function(done) {
        port++;
        done();
    });

    it('is attempted when server is down', function(done) {
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
            assert.equal("Hello", m.data);
            es.close();
            theClose(done);
        };
    });

    it('is attempted when server goes down after connection', function(done) {
        createServer(["data: Hello\n\n"], function(closeFirstServer) {
            var es = new EventSource('http://localhost:' + port);
            es.reconnectInterval = 0;

            es.onmessage = function(m) {
                assert.equal("Hello", m.data);
                closeFirstServer(function() {
                    createServer(["data: World\n\n"], function(closeSecondServer) {
                        es.onmessage = second;

                        function second(m) {
                            assert.equal("World", m.data);
                            es.close();
                            closeSecondServer(done);
                        }
                    });
                });
            };
        });
    });

    it('is not attempted when server responds with HTTP 204', function(done) {
        createServer(["data: Hello\n\n"], function(closeFirstServer) {
            var es = new EventSource('http://localhost:' + port);
            es.reconnectInterval = 0;

            es.onmessage = function(m) {
                assert.equal("Hello", m.data);
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
                                closeSecondServer(done);
                            }
                        }, 5);
                    }, function(req, res) { res.writeHead(204); res.end(); return true; });
                });
            };
        });
    });

    it('sends Last-Event-ID http header when it has previously been passed in an event from the server', function(done) {
        createServer(['id: 10\ndata: Hello\n\n'], function(closeFirstServer) {
            var headers = null;
            var es = new EventSource('http://localhost:' + port);
            es.reconnectInterval = 0;

            es.onmessage = function(m) {
                closeFirstServer(function() {
                    createServer([], function(close) {
                        es.onopen = function() {
                            assert.equal('10', headers['last-event-id']);
                            es.close();
                            close(done);
                        };
                    }, function(req) { headers = req.headers; });
                });
            };
        });
    });

    it('does not send Last-Event-ID http header when it has not been previously sent by the server', function(done) {
        createServer(['data: Hello\n\n'], function(closeFirstServer) {
            var headers = null;
            var es = new EventSource('http://localhost:' + port);
            es.reconnectInterval = 0;

            es.onmessage = function(m) {
                closeFirstServer(function() {
                    createServer([], function(close) {
                        es.onopen = function() {
                            assert.equal('undefined', typeof headers['last-event-id']);
                            es.close();
                            close(done);
                        };
                    }, function(req) { headers = req.headers; });
                });
            };
        });
    });

    it('is attempted after http 301 redirect uses new url', function(done) {
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
                                assert.equal(url + redirectSuffix, es.url);
                                es.close();
                                closeSecondServer(done);
                            };
                        }, function(req, res) { assert.equal(redirectSuffix, req.url); });
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
    });

    it('is attempted after http 307 redirect uses original url', function(done) {
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
                                assert.equal(url, es.url);
                                es.close();
                                closeSecondServer(done);
                            };
                        }, function(req, res) { assert.equal('/', req.url); });
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
    });
});

describe('readyState', function() {
    beforeEach(function(done) {
        port++;
        done();
    });

    it('has CONNECTING constant', function(done) {
        assert.equal(0, EventSource.CONNECTING);
        done();
    });

    it('has OPEN constant', function(done) {
        assert.equal(1, EventSource.OPEN);
        done();
    });

    it('has CLOSED constant', function(done) {
        assert.equal(2, EventSource.CLOSED);
        done();
    });

    it('is CONNECTING before connection has been established', function(done) {
        createServer([], function(close) {
            var es = new EventSource('http://localhost:' + port);
            assert.equal(EventSource.CONNECTING, es.readyState);
            es.onopen = function() {
                es.close();
                close(done);
            }
        });
    });

    it('is CONNECTING when server has closed the connection', function(done) {
        createServer(["data: Hello\n\n"], function(closeFirstServer) {
            var es = new EventSource('http://localhost:' + port);
            es.reconnectInterval = 0;

            es.onmessage = function(m) {
                assert.equal("Hello", m.data);
                closeFirstServer(function() {
                    createServer([], function(closeSecondServer) {
                        assert.equal(EventSource.CONNECTING, es.readyState);
                        es.close();
                        closeSecondServer(done);
                    });
                });
            };
        });
    });

    it('is OPEN when connection has been established', function(done) {
        createServer([], function(close) {
            var es = new EventSource('http://localhost:' + port);
            es.onopen = function() {
                assert.equal(EventSource.OPEN, es.readyState);
                es.close();
                close(done);
            }
        });
    });

    it('is CLOSED after connection has been closed', function(done) {
        createServer([], function(close) {
            var es = new EventSource('http://localhost:' + port);
            es.onopen = function() {
                es.close();
                assert.equal(EventSource.CLOSED, es.readyState);
                close(done);
            };
        });
    });
});

describe('Properties', function() {
    beforeEach(function(done) {
        port++;
        done();
    });

    it('url exposes original request url', function(done) {
        createServer([], function(close) {
            var url = 'http://localhost:' + port;
            var es = new EventSource(url);
            es.onopen = function() {
                assert.equal(url, es.url);
                es.close();
                close(done);
            }
        });
    });
});

describe('Events', function() {
    beforeEach(function(done) {
        port++;
        done();
    });

    it('calls onopen when connection is established', function(done) {
        createServer([], function(close) {
            var es = new EventSource('http://localhost:' + port);
            es.onopen = function() {
                es.close();
                close(done);
            }
        });
    });

    it('emits open event when connection is established', function(done) {
        createServer([], function(close) {
            var es = new EventSource('http://localhost:' + port);
            es.addEventListener('open', function() {
                es.close();
                close(done);
            });
        });
    });

    it('does not emit error when connection is closed by client', function(done) {
        createServer([], function(close) {
            var es = new EventSource('http://localhost:' + port);
            es.addEventListener('open', function() {
                es.close();
                setTimeout(function() {
                    close(done);
                }, 50);
            });
            es.addEventListener('error', function() {
                throw new Error('error should not be emitted');
            });
        });
    });
});

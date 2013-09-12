# EventSource [![Build Status](https://secure.travis-ci.org/aslakhellesoy/eventsource-node.png)](http://travis-ci.org/aslakhellesoy/eventsource-node) [![Dependencies](https://david-dm.org/aslakhellesoy/eventsource-node.png)](https://david-dm.org/aslakhellesoy/eventsource-node)

[![NPM](https://nodei.co/npm/eventsource.png?stars&downloads)](https://nodei.co/npm/eventsource/) 
[![NPM](https://nodei.co/npm-dl/eventsource.png)](https://nodei.co/npm/eventsource/)

This library implements the [EventSource](http://dev.w3.org/html5/eventsource/) client for Node.js. The API aims to be W3C compatible.

## Install

    npm install eventsource

## Usage

```javascript
var EventSource = require('eventsource');

var es = new EventSource('http://googlecodesamples.com/html5/sse/sse.php');
es.onmessage = function(e) {
    console.log(e.data);
};
es.onerror = function() {
    console.log('ERROR!');
};
```

See the [spec](http://dev.w3.org/html5/eventsource/) for API docs.

## Example

See https://github.com/einaros/sse-example

## Extensions to the W3C API

### Setting HTTP request headers

You can define custom HTTP headers for the initial HTTP request. This can be useful for e.g. sending cookies.
This is done by assigning a `header` attribute to the optional `eventSourceInitDict` argument:

```javascript
var eventSourceInitDict = {headers: {'Cookie': 'test=test'}};
var es = new EventSource(url, eventSourceInitDict);
```

### Allow unauthorized HTTPS requests

By default, https requests that cannot be authorized will cause connection to fail and an exception
to be emitted. You can override this behaviour:

```
var eventSourceInitDict = {rejectUnauthorized: false};
var es = new EventSource(url, eventSourceInitDict);
```


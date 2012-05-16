[![Build Status](https://secure.travis-ci.org/aslakhellesoy/eventsource-node.png)](http://travis-ci.org/aslakhellesoy/eventsource-node)

# EventSource

This library implements the [EventSource](http://dev.w3.org/html5/eventsource/) client for Node.js. The API aims to be W3C compatible.

## Install

    npm install eventsource

## Usage

```javascript
var EventSource = require('eventsource');

es = new EventSource('http://googlecodesamples.com/html5/sse/sse.php');
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

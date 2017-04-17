var express = require('express')
var serveStatic = require('serve-static')
var SSE = require('sse')

var app = express()
app.use(serveStatic(__dirname))

var server = app.listen(8080, function (err) {
  if (err) throw err
  console.log('server ready on http://localhost:8080')
})

var sse = new SSE(server)
sse.on('connection', function (connection) {
  console.log('new connection')
  var pusher = setInterval(function () {
    connection.send({
      event: 'server-time',
      data: new Date().toTimeString()
    })
  }, 1000)

  connection.on('close', function () {
    console.log('lost connection')
    clearInterval(pusher)
  })
})

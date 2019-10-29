var server = require('http').createServer()
  , WebSocket = require('ws')
  , WebSocketServer = WebSocket.Server
  , wss = new WebSocketServer({ server: server })
  , express = require('express')
  , app = express()
  , port = 4080;

app.use(function (req, res) {
  res.send({ msg: "hello" });
});


function send(ws, data){
  // is it a valid client and open ?
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(data);
  }
}

wss.on('connection', function connection(ws) {
  // you might use location.query.access_token to authenticate or share sessions
  // or ws.upgradeReq.headers.cookie (see http://stackoverflow.com/a/16395220/151312)

  ws.on('message', function incoming(message) {
    console.log('received: %s', message);
    // send it back ;-)
    send(ws, message);
  });

  ws.on('error', function(e) {
    console.error("got error", e); 
  });

    
  var message = {
    "eventId": "c603496f-9463-48b3-be87-d0d258ee0522",
    "name": "socket.info",
    "socketId": "f67c04df-8b5f-4496-b37e-d25cc462ab86",
    "apiSpaceId": "f4a5894e-259a-4030-8424-1eb74306be78",
    "context": {
      "createdBy": "stevanl"
    },
    "publishedOn": new Date().toISOString()
  };

  send(ws, JSON.stringify(message));

});

server.on('request', app);
server.listen(port, function () { console.log('Listening on ' + server.address().port) });
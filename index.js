var fs = require('fs');
var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

server.listen(3010);

app.use("/common", express.static( __dirname + "/common" ));

app.get('/', function (req, res) {
	var path = __dirname + "/resources/index.html";
	res.sendFile(path);
});
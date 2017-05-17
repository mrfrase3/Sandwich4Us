// Load in modules and files

var fs = require('fs');
var config = require('./config.json');
var exphbs  = require('express-handlebars');
var express = require('express');
var app = express();
var server;
var redirectServer;
var io;

//Initiate the webserver with http/https
var server;
var redirectServer;
if(config.server.https.enabled){
    var keys = {
        key: fs.readFileSync(config.server.https.key || "certs/key.pem", "utf8"), 
        cert: fs.readFileSync(config.server.https.cert || "certs/cert.pem", "utf8")
    };
    server = require('https').createServer(keys, app);
    if(config.server.http.enabled){
        redirectServer = require('http').Server();
        redirectServer.on('request', function(req, res){
            let port = ':' + (config.server.https.port || 3001);
            if(port == ':443') port = '';
            res.writeHead(301,
              {Location: 'https://'+req.headers.host+port+req.url}
            );
            res.end();
        });
        redirectServer.listen((config.server.http.port || 3000));
    }
    server.listen((config.server.https.port || 3001));
    console.log("Server started on port: " + (config.server.https.port || 3001));
} else {
    server = require('http').Server(app);
    server.listen((config.server.http.port || 3000));
    console.log("Server started on port: " + (config.server.http.port || 3000));
}
io = require('socket.io')(server);

// Setup express modules/settings/renderer
app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

app.use("/common", express.static( __dirname + "/common" ));

// Express routing

app.get('/', function (req, res) {
    var fill = {isPageIndex: true};
	res.render('index');
});
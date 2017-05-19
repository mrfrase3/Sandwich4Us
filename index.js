// Load in modules and files

const fs = require('fs');
var config = require('./config.json');
const exphbs  = require('express-handlebars');
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const mongoose = require('mongoose');
var app = express();
var server;
var redirectServer;
var io;

//Initiate the webserver with http/https
var server;
var redirectServer;
var port;
if(config.server.https.enabled){
    var keys = {
        key: fs.readFileSync(config.server.https.key || "certs/key.pem", "utf8"), 
        cert: fs.readFileSync(config.server.https.cert || "certs/cert.pem", "utf8")
    };
    server = require('https').createServer(keys, app);
    if(config.server.http.enabled){
        redirectServer = require('http').Server();
        redirectServer.on('request', function(req, res){
            let report = ':' + (config.server.https.port || 3001);
            if(report == ':443') report = '';
            res.writeHead(301,
              {Location: 'https://'+req.headers.host+report+req.url}
            );
            res.end();
        });
        redirectServer.listen((config.server.http.port || 3000));
    }
    port = (config.server.https.port || 3001);
} else {
    server = require('http').Server(app);
    port = (config.server.http.port || 3000);
}
io = require('socket.io')(server);

// Mongo Stuff

var mongouri = `mongodb://${config.database.mongo.user}:${config.database.mongo.password}`
    +`@${config.database.mongo.host}:${config.database.mongo.port}/${config.database.mongo.name}`;

// Setup express modules/settings/renderer

app.use(session({
    secret: config.session.secret,
    saveUninitialized: false, // dont save empty sessions
    resave: false, //don't save unchanged sessions
    store: new MongoStore({ 
        mongooseConnection: mongoose.connection, //reuse the existing mongoose connection
        touchAfter: 24 * 3600 //sec
    })
}));

app.set('trust proxy', 1);

app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

app.use("/common", express.static( __dirname + "/common" ));

// Express routing

app.get('/', function (req, res) {
    var fill = {isPageIndex: true};
	res.render('register', fill);
});

app.get('/login', function (req, res) {
    var fill = {isPageLogin: true};
    res.render('login', fill);
});

app.get('/references', function (req, res) {
    var fill = {isPageReferences: true};
    res.render('references', fill);
});

module.exports.start = ()=>{
    mongoose.connect(mongouri);
    server.listen(port);
    console.log("Server started on port: " + port);
    return port;
}

module.exports.stop = ()=>{
    mongoose.disconnect();
    server.close();
    console.log("Server stopped");
}

//start the server if being run directly from commandline
if(!module.parent) module.exports.start();
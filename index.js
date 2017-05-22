// Load in modules and files

const fs = require('fs');
var config = require('./config.json');
const bodyParser = require('body-parser');
const exphbs  = require('express-handlebars');
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const mongoose = require('mongoose');
const users = require('./lib/Users.js')(mongoose);
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

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

app.use("/common", express.static( __dirname + "/common" ));

// Express routing

app.get('/', (req, res)=>{
    var fill = {isPageIndex: true, user: req.session.user};
	if(!req.session.user) return res.render('register', fill);
	res.render('request', fill);
});

app.get('/register', (req, res)=>{
    var fill = {isPageIndex: true};
    if(req.session.user) return res.redirect(301, '/');
    res.render('register', fill);
});

app.post('/register', (req, res)=>{
    var fill = {isPageIndex: true};
    if(req.session.user) return res.redirect(301, '/');
    console.log(req.body);
    
    
    if(
        typeof req.body.reg_firstname !== 'string' ||
        typeof req.body.reg_lastname  !== 'string' ||
        typeof req.body.reg_email     !== 'string' ||
        typeof req.body.reg_password  !== 'string' ||
        typeof req.body.reg_password2 !== 'string'
    ){
        fill.forMessages = ["fields are missing, please contact an admin."];
        return res.render('references', fill);
    }
    if(req.body.reg_password !== req.body.reg_password2){
        fill.forMessages = ["Both Passwords provided do not match."];
        return res.render('references', fill);
    }
    
    users.register(req.body.reg_firstname, req.body.reg_lastname,
    req.body.reg_email, req.body.reg_password).then(user=>{
        req.session.user = {
            firstname: user.firstname,
            lastname: user.lastname,
            email: user.email,
            id: user.id
        };
        return res.redirect(301, '/');
    }).catch(errs=>{
        fill.forMessages = errs;
        fill.reg_firstname = req.body.reg_firstname;
        fill.reg_lastname = req.body.reg_lastname;
        fill.reg_email = req.body.reg_email;
        fill.reg_agree = req.body.reg_agree;
        return res.render('references', fill);
    });
});

app.get('/login', (req, res)=>{
    var fill = {isPageLogin: true};
    if(req.session.user) return res.redirect(301, '/');
    res.render('login', fill);
});

app.post('/login', (req, res)=>{
    var fill = {isPageLogin: true};
    if(req.session.user) return res.redirect(301, '/');
    
    if(
        typeof req.body.login_email     !== 'string' ||
        typeof req.body.login_password  !== 'string'
    ){
        fill.forMessages = ["fields are missing, please contact an admin."];
        return res.render('login', fill);
    }
    
    users.login(req.body.login_email, req.body.login_password).then(user=>{
        req.session.user = {
            firstname: user.firstname,
            lastname: user.lastname,
            email: user.email,
            id: user.id
        };
        return res.redirect(301, '/');
    }).catch(errs=>{
        fill.forMessages = errs;
        fill.reg_email = req.body.reg_email;
        return res.render('login', fill);
    });
});

app.use('/logout', (req, res)=>{
    req.session.destroy(function(err){
        if(err) console.error(err);
        res.redirect(301, '/');
    });
});

app.get('/references', (req, res)=>{
    var fill = {isPageReferences: true, user: req.session.user};
    res.render('references', fill);
});

app.get('/about', (req, res)=>{
    var fill = {isPageAbout: true, user: req.session.user};
    res.render('about', fill);
});


// Setup the exports //

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
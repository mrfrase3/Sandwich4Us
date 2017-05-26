// Load in modules and files

const fs = require('fs');
var config = require('./config.json');
const bodyParser = require('body-parser');
const exphbs  = require('express-handlebars');
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const Users = require('./lib/Users.js')(mongoose);
const Matcher = require('./lib/Matcher.js')(mongoose);
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
        redirectServer = require('http').createServer( function(req, res){
            let report = ':' + (config.server.https.port || 3001);
            if(report == ':443') report = '';
            let host = (req.headers.host || config.server.https.host).split(':')[0];
            res.writeHead(302,
                {Location: 'https://'+host+report+req.url}
            );
            res.end();
        });
        redirectServer.listen((config.server.http.port || 3000));
    }
    port = (config.server.https.port || 3001);
    
    app.use(function(req,res,next) {
        if (!/https/.test(req.protocol)){
            res.redirect("https://" + req.headers.host + req.url);
        } else {
            return next();
        } 
    });
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

app.get('/', (req, res, next)=>{
    var fill = {isPageIndex: true};
	if(!req.session.user) return res.render('register', fill);
	next();
});

app.get('/', (req, res, next)=>{
    var fill = {isPageIndex: true, user: req.session.user};
    Matcher.getRequestByOwner(req.session.user.id).catch(console.error).then(match_req =>{
        if(!match_req) return next();
        fill.isPageMatches = true;
        fill.GoogleMapsAPIKey = config.other.GoogleMapsAPIKey;
        fill.req = match_req;
        fill.req.expires_safe = fill.req.expires.valueOf();
        res.render('matches', fill);
    });
});

var send_req_page = (req, res, fill) => {
    if(!fill) fill = {user: req.session.user};
    if(!req.session.user) return res.redirect(301, '/');
    Matcher.getRequestByOwner(req.session.user.id).catch(console.error).then(match_req =>{
        if(!match_req) match_req = {expires: new Date(0), loc: [0, 0]};
        fill.isPageRequest = true;
        fill.GoogleMapsAPIKey = config.other.GoogleMapsAPIKey;
        fill.req_num = match_req.num_sandwiches || req.body.req_num;
        fill.req_dist = match_req.dist || req.body.req_dist;
        fill.req_end = req.body.req_end || match_req.expires.valueOf();
        fill.req_long = match_req.loc[0] || req.body.req_long;
        fill.req_lat = match_req.loc[1] || req.body.req_lat;
        Matcher.getIngredients(req.session.user.id, req.body.req_want, req.body.req_have)
        .catch(console.error).then(ings => {
            fill.ingredients = ings;
            res.render('request', fill);
        });
    });
};


app.get('/', (req, res)=>{
    send_req_page(req, res, {isPageIndex: true, user: req.session.user});
});

app.get('/request', (req, res, next)=>{
    send_req_page(req, res);
});

app.post('/request', (req, res, next)=>{
    if(!req.session.user) return res.redirect(301, '/');
    var errored = false;
    Matcher.newRequest(
        req.session.user.id,
        req.session.user.firstname,
        req.body.req_num,
        req.body.req_dist,
        req.body.req_end,
        req.body.req_long,
        req.body.req_lat,
        req.body.req_want,
        req.body.req_have
    ).catch(err => {
        errored = true;
        send_req_page(req, res, {user: req.session.user, formMessages: err});
    }).then(match_req => {
        if(!errored) res.redirect(301, '/');
    });
});

app.get('/register', (req, res)=>{
    var fill = {isPageIndex: true};
    if(req.session.user) return res.redirect(301, '/');
    res.render('register', fill);
});

app.post('/register', (req, res)=>{
    var fill = {isPageIndex: true};
    if(req.session.user) return res.redirect(301, '/');
    
    if(
        typeof req.body.reg_firstname !== 'string' ||
        typeof req.body.reg_lastname  !== 'string' ||
        typeof req.body.reg_email     !== 'string' ||
        typeof req.body.reg_password  !== 'string' ||
        typeof req.body.reg_password2 !== 'string' ||
        typeof req.body.reg_agree     !== 'string'
    ){
        fill.formMessages = ["fields are missing, please contact an admin."];
        return res.render('register', fill);
    }
    if(req.body.reg_password !== req.body.reg_password2){
        fill.formMessages = ["Both Passwords provided do not match."];
        return res.render('register', fill);
    }
    if(req.body.reg_agree !== "agree"){
        fill.formMessages = ["You must sell your soul, the sandwich is worth it."];
        return res.render('register', fill);
    }
    
    Users.register(req.body.reg_firstname, req.body.reg_lastname,
    req.body.reg_email, req.body.reg_password).then(user=>{
        req.session.user = {
            firstname: user.firstname,
            lastname: user.lastname,
            email: user.email,
            id: user.id
        };
        user.validated = true;
        user.save();
        return res.redirect(301, '/');
    }).catch(errs=>{
        fill.formMessages = errs;
        fill.reg_firstname = req.body.reg_firstname;
        fill.reg_lastname = req.body.reg_lastname;
        fill.reg_email = req.body.reg_email;
        fill.reg_agree = req.body.reg_agree;
        return res.render('register', fill);
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
        fill.formMessages = ["fields are missing, please contact an admin."];
        return res.render('login', fill);
    }
    
    Users.login(req.body.login_email, req.body.login_password).then(user=>{
        req.session.user = {
            firstname: user.firstname,
            lastname: user.lastname,
            email: user.email,
            id: user.id.toString("hex")
        };
        return res.redirect(301, '/');
    }).catch(errs=>{
        fill.formMessages = errs;
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

app.get('/sockauth', (req, res) => {
    if(!req.session.user) return res.json({success: false, login: false});
    Users.genToken(req.session.user.id, 'sockauth', Date.now()+60*1000)
    .catch( err => {
        return res.json({success: false, login: true, err});
    }).then(token => {
        return res.json({success: true, token, id: req.session.user.id});
    });
});

// Setup Sockets //

io.on('connect', (socket) => {
    
    socket.on('sockauth.useToken', (data) => {
        if(socket.user) return;
        let errored = false;
        Users.useToken(data.id, 'sockauth', data.token).catch( err =>{
            errored = true;
            socket.emit('sockauth.error', err);  
        }).then(success => {
            if(errored) return;
            if(!success) return socket.emit('sockauth.error', ["Token passed not valid, try refreshing the page."]);
            Users.get(data.id).catch( err => socket.emit('sockauth.error', err)).then(user => {
                socket.user = {
                    firstname: user.firstname,
                    lastname: user.lastname,
                    email: user.email,
                    id: user.id
                };
                Matcher.addSocket(user.id, socket);
                socket.emit('sockauth.success');
            });
        });
    });
    
    socket.emit('sockauth.init');
    
});


// Setup the exports //

module.exports.start = () => {
    mongoose.connect(mongouri);
    server.listen(port);
    console.log("Server started on port: " + port);
    return port;
}

module.exports.stop = () => {
    mongoose.disconnect();
    server.close();
    console.log("Server stopped");
}

//start the server if being run directly from commandline
if(!module.parent) module.exports.start();
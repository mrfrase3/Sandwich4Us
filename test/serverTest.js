const assert = require("assert");
const request = require("request");
const fs = require("fs");
const https = require("https");
var server;
var port;
var proto = "https://";
var agent;

var config = require("../config.json");
if(process.env.TRAVIS){ //change db to travis's own mongo
    config.database.mongo.host = "127.0.0.1";
    config.database.mongo.port = 27017;
    config.database.mongo.user = "";
    config.database.mongo.password = "";
    fs.writeFileSync("../config.json", JSON.stringify(config));
}

describe("Server-runTest", function(){
    
    before(function(){
        server = require("../index.js");
        port = server.start();
        agent = new https.Agent({
            host: 'host',
            port: ''+port,
            path: '/',
            rejectUnauthorized: false
        });
    });
    
    after(function(){
        server.stop();
    });
       
    it("returns the a page from the /common static directory", function(done){
        request.get({url: proto+"localhost:"+port+"/common/css/theme.css", agent}, function(err, res, body){
            assert.ifError(err);
            assert.equal(res.statusCode, 200, "server does not send file for some reason");
            assert.notEqual(body.length, 0, "empty file was given");
            
            assert.notEqual(body.indexOf("body {"), -1, "the file is not correct");
            
            done();
        });
    });
    
    it("returns the index/register page with all bits", function(done){
        request.get({url: proto+"localhost:"+port+"/", agent}, function(err, res, body){
            assert.ifError(err);
            assert.equal(res.statusCode, 200, "server does not send file for some reason");
            assert.notEqual(body.length, 0, "empty file was given");
            
            assert.notEqual(body.indexOf("<body>"), -1, "the main layout was not rendered");
            assert.notEqual(body.indexOf("./common/css/theme.css"), -1, "the css partial was not rendered");
            assert.notEqual(body.indexOf("./common/js/main.js"), -1, "the js partial was not rendered");
            assert.notEqual(body.indexOf("class=\"navbar"), -1, "the navbar partial was not rendered");
            assert.notEqual(body.indexOf("class=\"footer"), -1, "the footer partial was not rendered");
            
            assert.notEqual(body.indexOf("tile register"), -1, "the register view was not rendered");
            
            done();
        });
    });
    
    it("returns the login page with all bits", function(done){
        request.get({url: proto+"localhost:"+port+"/login", agent}, function(err, res, body){
            assert.ifError(err);
            assert.equal(res.statusCode, 200, "server does not send file for some reason");
            assert.notEqual(body.length, 0, "empty file was given");
            
            assert.notEqual(body.indexOf("<body>"), -1, "the main layout was not rendered");
            assert.notEqual(body.indexOf("./common/css/theme.css"), -1, "the css partial was not rendered");
            assert.notEqual(body.indexOf("./common/js/main.js"), -1, "the js partial was not rendered");
            assert.notEqual(body.indexOf("class=\"navbar"), -1, "the navbar partial was not rendered");
            assert.notEqual(body.indexOf("class=\"footer"), -1, "the footer partial was not rendered");
            
            assert.notEqual(body.indexOf("tile login"), -1, "the register view was not rendered");
            
            done();
        });
    });
    
    it("returns the references page with all bits", function(done){
        request.get({url: proto+"localhost:"+port+"/references", agent}, function(err, res, body){
            assert.ifError(err);
            assert.equal(res.statusCode, 200, "server does not send file for some reason");
            assert.notEqual(body.length, 0, "empty file was given");
            
            assert.notEqual(body.indexOf("<body>"), -1, "the main layout was not rendered");
            assert.notEqual(body.indexOf("./common/css/theme.css"), -1, "the css partial was not rendered");
            assert.notEqual(body.indexOf("./common/js/main.js"), -1, "the js partial was not rendered");
            assert.notEqual(body.indexOf("class=\"navbar"), -1, "the navbar partial was not rendered");
            assert.notEqual(body.indexOf("class=\"footer"), -1, "the footer partial was not rendered");
            
            assert.notEqual(body.indexOf("tile references"), -1, "the ref view was not rendered");
            
            done();
        });
    });
    
    it("returns the about page with all bits", function(done){
        request.get({url: proto+"localhost:"+port+"/about", agent}, function(err, res, body){
            assert.ifError(err);
            assert.equal(res.statusCode, 200, "server does not send file for some reason");
            assert.notEqual(body.length, 0, "empty file was given");
            
            assert.notEqual(body.indexOf("<body>"), -1, "the main layout was not rendered");
            assert.notEqual(body.indexOf("./common/css/theme.css"), -1, "the css partial was not rendered");
            assert.notEqual(body.indexOf("./common/js/main.js"), -1, "the js partial was not rendered");
            assert.notEqual(body.indexOf("class=\"navbar"), -1, "the navbar partial was not rendered");
            assert.notEqual(body.indexOf("class=\"footer"), -1, "the footer partial was not rendered");
            
            assert.notEqual(body.indexOf("tile about"), -1, "the ref view was not rendered");
            
            done();
        });
    });
    
});
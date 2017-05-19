const assert = require("assert");
const server = require("../index.js");
const request = require("request");
var port;
var proto = "http://";

describe("Server-runTest", function(){
    
    before(function(){
        port = server.start();
    });
    
    after(function(){
        server.stop();
    });
       
    it("returns the a page from the /common static directory", function(done){
        request.get(proto+"localhost:"+port+"/common/css/theme.css", function(err, res, body){
            assert.ifError(err);
            assert.equal(res.statusCode, 200, "server does not send file for some reason");
            assert.notEqual(body.length, 0, "empty file was given");
            
            assert.notEqual(body.indexOf("body {"), -1, "the file is not correct");
            
            done();
        });
    });
    
    it("returns the index/register page with all bits", function(done){
        request.get(proto+"localhost:"+port+"/", function(err, res, body){
            assert.ifError(err);
            assert.equal(res.statusCode, 200, "server does not send file for some reason");
            assert.notEqual(body.length, 0, "empty file was given");
            
            assert.notEqual(body.indexOf("<body>"), -1, "the main layout was not rendered");
            assert.notEqual(body.indexOf("./common/css/theme.css"), -1, "the css partial was not rendered");
            assert.notEqual(body.indexOf("./common/js/main.js"), -1, "the js partial was not rendered");
            assert.notEqual(body.indexOf("class=\"navbar\""), -1, "the navbar partial was not rendered");
            assert.notEqual(body.indexOf("class=\"footer\""), -1, "the footer partial was not rendered");
            
            assert.notEqual(body.indexOf("tile register"), -1, "the register view was not rendered");
            
            done();
        });
    });
    
    it("returns the login page with all bits", function(done){
        request.get(proto+"localhost:"+port+"/login", function(err, res, body){
            assert.ifError(err);
            assert.equal(res.statusCode, 200, "server does not send file for some reason");
            assert.notEqual(body.length, 0, "empty file was given");
            
            assert.notEqual(body.indexOf("<body>"), -1, "the main layout was not rendered");
            assert.notEqual(body.indexOf("./common/css/theme.css"), -1, "the css partial was not rendered");
            assert.notEqual(body.indexOf("./common/js/main.js"), -1, "the js partial was not rendered");
            assert.notEqual(body.indexOf("class=\"navbar\""), -1, "the navbar partial was not rendered");
            assert.notEqual(body.indexOf("class=\"footer\""), -1, "the footer partial was not rendered");
            
            assert.notEqual(body.indexOf("tile login"), -1, "the register view was not rendered");
            
            done();
        });
    });
    
});
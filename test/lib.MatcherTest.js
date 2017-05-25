const assert = require("assert");
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
class FakeSocket extends require('events') {}
var Users, Matcher;
var mike, mike2;
var mike_req;

var config = require("../config.json");
if(process.env.TRAVIS){ //change db to travis's own mongo
    config.database.mongo.host = "127.0.0.1";
    config.database.mongo.port = 27017;
    config.database.mongo.user = "";
    config.database.mongo.password = "";
}

var mongouri = `mongodb://${config.database.mongo.user}:${config.database.mongo.password}`
+`@${config.database.mongo.host}:${config.database.mongo.port}/${config.database.mongo.name}`;

describe("Matcher-unitTest", function(){
    
    before(function(){
        mongoose.connect(mongouri);
        Users = require('../lib/Users.js')(mongoose);
        Matcher = require('../lib/Matcher.js')(mongoose);
    });
    
    after(function(){
        mongoose.disconnect();
    });
    
    describe("Test General", function(){
        
        before(function(){
            return new Promise((resolve, reject) => {
                Users.register("Mike", "Jones", "mike.jones@example.com", "I<3CatsNotDogs")
                .catch(reject).catch(reject).then((user)=>{
                    mike = user;
                    user.validated = true;
                    user.save().then(()=>{
                        Users.register("OtherMike", "Jones", "mike2.jones@example.com", "I<3CatsNotDogs")
                        .catch(reject).catch(reject).then((user2)=>{
                            mike2 = user2;
                            user2.validated = true;
                            user2.save().then(resolve).catch(reject).catch(reject);
                        });
                    }).catch(reject).catch(reject);
                });
                
            });
        });
        
        after(function(){
            return Users.remove(mike.id, "I<3CatsNotDogs");
        });
        
        it("can create/get/remove a request with valid credentials", function(){
            return new Promise((resolve, reject) => {
                Matcher.newRequest(
                    mike.id, mike.firstname, 2, 2,
                    Date.now()+60*1000, 115.817786, -31.978968,
                    ["white bread", "tomato sauce"], ["hot salami"]
                ).catch(reject).catch(reject).then((request)=>{
                    assert.ok(request, "request was not made");
                    Promise.all([
                        Matcher.getRequestByOwner(mike.id),
                        Matcher.getRequestById(request.id),
                        Matcher.getIngredients(mike.id)
                    ]).catch(reject).catch(reject).then(data => {
                        assert.ok(data[0], "getRequestByOwner did not return request");
                        assert.ok(data[1], "getRequestById did not return request");
                        assert.equal(data[0].id, request.id, "getRequestByOwner did not return correct request");
                        assert.equal(data[1].id, request.id, "getRequestByOwner did not return correct request");
                        for(let i in data[2]){
                            if(data[2][i].name === "white bread"){
                                assert.equal(data[2][i].want, true, "ingredients not populated with wants properly - wb");
                                assert.equal(data[2][i].have, false, "ingredients not populated with haves properly - wb");
                            }
                            if(data[2][i].name === "hot salami"){
                                assert.equal(data[2][i].want, false, "ingredients not populated with wants properly - hs");
                                assert.equal(data[2][i].have, true, "ingredients not populated with haves properly - hs");
                            }
                        }
                        request.expires = new Date(Date.now() +20);
                        request.markModified('expires');
                        request.save().catch(reject).then(() => {
                            setTimeout(() => {
                                Matcher.getRequestByOwner(mike.id).catch(reject).catch(reject).then(expreq => {
                                    assert.ifError(expreq, "returned expired request");
                                    resolve();
                                });
                            }, 40);
                        });
                    });
                });
            });
        });
        
        it("can match requests a request with valid credentials", function(){
            return new Promise((resolve, reject) => {
                Promise.all([
                    Matcher.newRequest(
                        mike.id, mike.firstname, 2, 2,
                        Date.now()+60*1000, 115.817786, -31.978968,
                        ["hotdog bun", "hot salami"], ["tomato sauce"]
                    ),
                    Matcher.newRequest(
                        mike2.id, mike2.firstname, 2, 2,
                        Date.now()+60*1000, 115.8160915, -31.9776193,
                        ["white bread", "tomato sauce"], ["hot salami", "vintage cheese"]
                    )]).catch(reject).catch(reject).then((requests)=>{
                    assert.ok(requests[0], "request was not made 0");
                    assert.ok(requests[1], "request was not made 1");
                    var fsock1 = new FakeSocket();
                    requests[0].addSocket(fsock1);
                    fsock1.once('matches.list', (matches)=>{
                        if(matches.length !== 1) return reject("invalid number of matches returned");
                        if(matches[0].id !== requests[1].id) return reject("invalid match returned");
                        console.log("match: " + JSON.stringify(matches[0]));
                        requests[0].expires = new Date(Date.now() +20);
                        requests[0].markModified('expires');
                        requests[0].save();
                        requests[1].expires = new Date(Date.now() +20);
                        requests[1].markModified('expires');
                        requests[1].save();
                        resolve();
                    });
                    fsock1.emit('matches.get');
                });
            });
        });
        
    });
});
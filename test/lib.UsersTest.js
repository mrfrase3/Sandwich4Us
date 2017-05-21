const assert = require("assert");
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
var Users;
var mike;
var mike_token;

var config = require("../config.json");
if(process.env.TRAVIS){ //change db to travis's own mongo
    config.database.mongo.host = "127.0.0.1";
    config.database.mongo.port = 27017;
    config.database.mongo.user = "";
    config.database.mongo.password = "";
}

var mongouri = `mongodb://${config.database.mongo.user}:${config.database.mongo.password}`
+`@${config.database.mongo.host}:${config.database.mongo.port}/${config.database.mongo.name}`;

describe("Users-unitTest", function(){
    
    before(function(){
        mongoose.connect(mongouri);
        Users = require('../lib/Users.js')(mongoose);
    });
    
    after(function(){
        mongoose.disconnect();
    });
    
    describe("Test General", function(){
        
        before(function(){
            return new Promise((resolve, reject) => {
                Users.register("Mike", "Jones", "mike.jones@example.com", "I<3CatsNotDogs")
                .catch(reject).then((user)=>{
                    mike = user;
                    user.validated = true;
                    user.save().then(resolve).catch(reject);
                });
            });
        });
        
        after(function(){
            return Users.remove(mike.id, "I<3CatsNotDogs");
        });
        
        it("can register/login/remove user with valid credentials", function(){
            return new Promise((resolve, reject) => {
                Users.register("Amy", "Tester", "amy.tester@example.com", "AGoodPassword").then((user)=>{
                    //console.log(user);
                    assert.equal(user.firstname, "amy", "First name saved in registration is incorrect");
                    assert.equal(user.lastname, "tester", "Last name saved in registration is incorrect");
                    assert.equal(user.email, "amy.tester@example.com", "email saved in registration is incorrect");
                    user.validated = true;
                    user.save(function(err){
                        assert.ifError(err);
                        Users.login("amy.tester@example.com", "AGoodPassword").then((user)=>{
                            assert.ok(user, "No user returned on 'successful' login");
                            assert.equal(user.email, "amy.tester@example.com", "user returned on login is incorrect");
                            Users.remove(user.id, "AGoodPassword").then(()=>{
                                Users.get("amy.tester@example.com").then((user)=>{
                                    assert.equal(!!user, false, "registered user was not removed.");
                                    resolve();
                                }).catch(reject).catch(reject);
                                
                            }).catch(reject).catch(reject);
                        }).catch(reject).catch(reject);
                    });
                }).catch(reject).catch(reject);
            });
        });
        
        it("can generate and use tokens", function(){
            return new Promise((resolve, reject) => {
                Users.genToken(mike.id, "sockauth", Date.now() + 300*1000).then((token)=>{
                    assert.ok(token, "token was not provided");
                    Users.useToken(mike.id, "sockauth", token).then((valid)=>{
                        assert.equal(valid, true, "token was not usable");
                        Users.useToken(mike.id, "sockauth", token).then((valid)=>{
                            assert.equal(valid, false, "token was usable after already being used");
                            resolve();
                        }).catch(reject).catch(reject);
                    }).catch(reject).catch(reject);
                }).catch(reject).catch(reject);
            });
        });
        
        it("can generate but wont pass expired", function(){
            return new Promise((resolve, reject) => {
                Users.genToken(mike.id, "sockauth", Date.now() - 300*1000).then((token)=>{
                    assert.ok(token, "token was not provided");
                    Users.useToken(mike.id, "sockauth", token).then((valid)=>{
                        assert.equal(valid, false, "token was usable even though expired");
                        resolve();
                    }).catch(reject).catch(reject);
                }).catch(reject).catch(reject);
            });
        });
        
    });
    
    describe("Test Register", function(){
    
        before(function(){
            return new Promise((resolve, reject) => {
                Users.register("Mike", "Jones", "mike.jones@example.com", "I<3CatsNotDogs")
                .catch(reject).then((user)=>{
                    mike = user;
                    user.validated = true;
                    user.save().then(resolve).catch(reject);
                });
            });
        });
        
        after(function(){
            return Users.remove(mike.id, "I<3CatsNotDogs");
        });
    
        it("can throw when registering user with invalid credentials (firstname)(bad match)", function(){
            return new Promise((resolve, reject) => {
                Users.register("Jane9*$&^$", "Smith", "jane.smith@example.com", "StrongPassword").catch((err)=>{
                    assert.ok(err);
                    console.log(err);
                    resolve();
                }).then((user)=>{
                    assert.ifError(user, "Invalid credentials passed validation");
                }).catch(reject);
            });
        });
        
        it("can throw when registering user with invalid credentials (firstname)(blank)", function(){
            return new Promise((resolve, reject) => {
                Users.register("", "Smith", "jane.smith@example.com", "StrongPassword").catch((err)=>{
                    assert.ok(err);
                    console.log(err);
                    resolve();
                }).then((user)=>{
                    assert.ifError(user, "Invalid credentials passed validation");
                }).catch(reject);
            });
        });
        
        it("can throw when registering user with invalid credentials (firstname)(undefined)", function(){
            return new Promise((resolve, reject) => {
                Users.register(undefined, "Smith", "jane.smith@example.com", "StrongPassword").catch((err)=>{
                    assert.ok(err);
                    console.log(err);
                    resolve();
                }).then((user)=>{
                    assert.ifError(user, "Invalid credentials passed validation");
                }).catch(reject);
            });
        });
        
        it("can throw when registering user with invalid credentials (lastname)(bad match)", function(){
            return new Promise((resolve, reject) => {
                Users.register("Jane", "Smith5~:$($*%@", "jane.smith@example.com", "StrongPassword").catch((err)=>{
                    assert.ok(err);
                    console.log(err);
                    resolve();
                }).then((user)=>{
                    assert.ifError(user, "Invalid credentials passed validation");
                }).catch(reject);
            });
        });
        
        it("can throw when registering user with invalid credentials (lastname)(blank)", function(){
            return new Promise((resolve, reject) => {
                Users.register("Jane", "", "jane.smith@example.com", "StrongPassword").catch((err)=>{
                    assert.ok(err);
                    console.log(err);
                    resolve();
                }).then((user)=>{
                    assert.ifError(user, "Invalid credentials passed validation");
                }).catch(reject);
            });
        });
        
        it("can throw when registering user with invalid credentials (lastname)(undefined)", function(){
            return new Promise((resolve, reject) => {
                Users.register("Jane", undefined, "jane.smith@example.com", "StrongPassword").catch((err)=>{
                    assert.ok(err);
                    console.log(err);
                    resolve();
                }).then((user)=>{
                    assert.ifError(user, "Invalid credentials passed validation");
                }).catch(reject);
            });
        });
        
        it("can throw when registering user with invalid credentials (email)(dupe)", function(){
            return new Promise((resolve, reject) => {
                Users.register("Jane", "Smith", "mike.jones@example.com", "StrongPassword").catch((err)=>{
                    assert.ok(err);
                    console.log(err);
                    resolve();
                }).then((user)=>{
                    assert.ifError(user, "Invalid credentials passed validation");
                }).catch(reject);
            });
        });
        
        it("can throw when registering user with invalid credentials (email)(bad match)", function(){
            return new Promise((resolve, reject) => {
                Users.register("Jane", "Smith", "jane.smithexample.com", "StrongPassword").catch((err)=>{
                    assert.ok(err);
                    console.log(err);
                    resolve();
                }).then((user)=>{
                    assert.ifError(user, "Invalid credentials passed validation");
                }).catch(reject);
            });
        });
        
        it("can throw when registering user with invalid credentials (email)(blank)", function(){
            return new Promise((resolve, reject) => {
                Users.register("Jane", "Smith", "", "StrongPassword").catch((err)=>{
                    assert.ok(err);
                    console.log(err);
                    resolve();
                }).then((user)=>{
                    assert.ifError(user, "Invalid credentials passed validation");
                }).catch(reject);
            });
        });
        
        it("can throw when registering user with invalid credentials (email)(undefined)", function(){
            return new Promise((resolve, reject) => {
                Users.register("Jane", "Smith", undefined, "StrongPassword").catch((err)=>{
                    assert.ok(err);
                    console.log(err);
                    resolve();
                }).then((user)=>{
                    assert.ifError(user, "Invalid credentials passed validation");
                }).catch(reject);
            });
        });
        
        it("can throw when registering user with invalid credentials (password)(too short)", function(){
            return new Promise((resolve, reject) => {
                Users.register("Jane", "Smith", "jane.smith@example.com", "weak").catch((err)=>{
                    assert.ok(err);
                    console.log(err);
                    resolve();
                }).then((user)=>{
                    assert.ifError(user, "Invalid credentials passed validation");
                }).catch(reject);
            });
        });
        
        it("can throw when registering user with invalid credentials (password)(blank)", function(){
            return new Promise((resolve, reject) => {
                Users.register("Jane", "Smith", "jane.smith@example.com", "").catch((err)=>{
                    assert.ok(err);
                    console.log(err);
                    resolve();
                }).then((user)=>{
                    assert.ifError(user, "Invalid credentials passed validation");
                }).catch(reject);
            });
        });
        
        it("can throw when registering user with invalid credentials (password)(undefined)", function(){
            return new Promise((resolve, reject) => {
                Users.register("Jane", "Smith", "jane.smith@example.com", undefined).catch((err)=>{
                    assert.ok(err);
                    console.log(err);
                    resolve();
                }).then((user)=>{
                    assert.ifError(user, "Invalid credentials passed validation");
                }).catch(reject);
            });
        });
    });
    
    
    describe("Test Login", function(){
    
        before(function(){
            return new Promise((resolve, reject) => {
                Users.register("Mike", "Jones", "mike.jones@example.com", "I<3CatsNotDogs")
                .catch(reject).then((user)=>{
                    mike = user;
                    user.validated = true;
                    user.save().then(resolve).catch(reject);
                });
            });
        });
        
        after(function(){
            return Users.remove(mike.id, "I<3CatsNotDogs");
        });
    
        it("can throw when logging in as user with invalid credentials (email)(no exist)", function(){
            return new Promise((resolve, reject) => {
                Users.login("nobody@example.com", "I<3CatsNotDogs").catch((err)=>{
                    assert.ok(err);
                    console.log(err);
                    resolve();
                }).then((user)=>{
                    assert.ifError(user, "Invalid credentials passed login");
                }).catch(reject);
            });
        });
        
        it("can throw when logging in as user with invalid credentials (email)(undefined)", function(){
            return new Promise((resolve, reject) => {
                Users.login(undefined, "I<3CatsNotDogs").catch((err)=>{
                    assert.ok(err);
                    console.log(err);
                    resolve();
                }).then((user)=>{
                    assert.ifError(user, "Invalid credentials passed login");
                }).catch(reject);
            });
        });
        
        it("can throw when logging in as user with invalid credentials (password)(wrong)", function(){
            return new Promise((resolve, reject) => {
                Users.login("mike.jones@example.com", "WrongPassword").catch((err)=>{
                    assert.ok(err);
                    console.log(err);
                    resolve();
                }).then((user)=>{
                    assert.ifError(user, "Invalid credentials passed login");
                }).catch(reject);
            });
        });
        
        it("can throw when logging in as user with invalid credentials (password)(blank)", function(){
            return new Promise((resolve, reject) => {
                Users.login("mike.jones@example.com", "").catch((err)=>{
                    assert.ok(err);
                    console.log(err);
                    resolve();
                }).then((user)=>{
                    assert.ifError(user, "Invalid credentials passed login");
                }).catch(reject);
            });
        });
        
        it("can throw when logging in as user with invalid credentials (password)(undefined)", function(){
            return new Promise((resolve, reject) => {
                Users.login("mike.jones@example.com", undefined).catch((err)=>{
                    assert.ok(err);
                    console.log(err);
                    resolve();
                }).then((user)=>{
                    assert.ifError(user, "Invalid credentials passed login");
                }).catch(reject);
            });
        });
        
    });
    
    describe("Test Remove", function(){
    
        before(function(){
            return new Promise((resolve, reject) => {
                Users.register("Mike", "Jones", "mike.jones@example.com", "I<3CatsNotDogs")
                .catch(reject).then((user)=>{
                    mike = user;
                    user.validated = true;
                    user.save().then(resolve).catch(reject);
                });
            });
        });
        
        after(function(){
            return Users.remove(mike.id, "I<3CatsNotDogs");
        });
        
        it("can throw when removing a user with invalid credentials (id)(no exist)", function(){
            return new Promise((resolve, reject) => {
                Users.remove("123456781234567812345678", "I<3CatsNotDogs").catch((err)=>{
                    assert.ok(err);
                    console.log(err);
                    resolve();
                }).then((user)=>{
                    assert.ifError(user, "Invalid credentials passed remove");
                }).catch(reject);
            });
        });
    
        it("can throw when removing a user with invalid credentials (id)(invalid)", function(){
            return new Promise((resolve, reject) => {
                Users.remove(1234, "I<3CatsNotDogs").catch((err)=>{
                    assert.ok(err);
                    console.log(err);
                    resolve();
                }).then((user)=>{
                    assert.ifError(user, "Invalid credentials passed remove");
                }).catch(reject);
            });
        });
        
        it("can throw when removing a user with invalid credentials (id)(undefined)", function(){
            return new Promise((resolve, reject) => {
                Users.remove(undefined, "I<3CatsNotDogs").catch((err)=>{
                    assert.ok(err);
                    console.log(err);
                    resolve();
                }).then((user)=>{
                    assert.ifError(user, "Invalid credentials passed remove");
                }).catch(reject);
            });
        });
        
        it("can throw when removing a user with invalid credentials (password)(wrong)", function(){
            return new Promise((resolve, reject) => {
                Users.remove(mike.id, "WrongPassword").catch((err)=>{
                    assert.ok(err);
                    console.log(err);
                    resolve();
                }).then((user)=>{
                    assert.ifError(user, "Invalid credentials passed remove");
                }).catch(reject);
            });
        });
        
        it("can throw when removing a user with invalid credentials (password)(blank)", function(){
            return new Promise((resolve, reject) => {
                Users.remove(mike.id, "").catch((err)=>{
                    assert.ok(err);
                    console.log(err);
                    resolve();
                }).then((user)=>{
                    assert.ifError(user, "Invalid credentials passed remove");
                }).catch(reject);
            });
        });
        
        it("can throw when removing a user with invalid credentials (password)(undefined)", function(){
            return new Promise((resolve, reject) => {
                Users.remove(mike.id, undefined).catch((err)=>{
                    assert.ok(err);
                    console.log(err);
                    resolve();
                }).then((user)=>{
                    assert.ifError(user, "Invalid credentials passed remove");
                }).catch(reject);
            });
        });
        
    });
    
    describe("Test Get", function(){
    
        before(function(){
            return new Promise((resolve, reject) => {
                Users.register("Mike", "Jones", "mike.jones@example.com", "I<3CatsNotDogs")
                .catch(reject).then((user)=>{
                    mike = user;
                    user.validated = true;
                    user.save().then(resolve).catch(reject);
                });
            });
        });
        
        after(function(){
            return Users.remove(mike.id, "I<3CatsNotDogs");
        });
    
        it("wont throw when getting a user with invalid credentials (search)(email no exist)", function(){
            return new Promise((resolve, reject) => {
                Users.get("nobody@example.com").then((user)=>{
                    assert.equal(user, null, "get returned a user with an invalid search");
                    resolve();
                }).catch(reject).catch(reject);
            });
        });
        
        it("wont throw when getting a user with invalid credentials (search)(invalid)", function(){
            return new Promise((resolve, reject) => {
                Users.get("tomato").then((user)=>{
                    assert.equal(user, null, "get returned a user with an invalid search");
                    resolve();
                }).catch(reject).catch(reject);
            });
        });
        
        it("wont throw when getting a user with invalid credentials (search)(invalid2)", function(){
            return new Promise((resolve, reject) => {
                Users.get(1234).then((user)=>{
                    assert.equal(user, null, "get returned a user with an invalid search");
                    resolve();
                }).catch(reject).catch(reject);
            });
        });
        
        it("wont throw when getting a user with invalid credentials (search)(id no exist)", function(){
            return new Promise((resolve, reject) => {
                Users.get("123456781234567812345678").then((user)=>{
                    assert.equal(user, null, "get returned a user with an invalid search");
                    resolve();
                }).catch(reject).catch(reject);
            });
        });
        
        it("wont throw when getting a user with invalid credentials (search)(undefined)", function(){
            return new Promise((resolve, reject) => {
                Users.get(undefined).then((user)=>{
                    assert.equal(user, null, "get returned a user with an invalid search");
                    resolve();
                }).catch(reject).catch(reject);
            });
        });
        
    });
    
    describe("Test genToken", function(){
    
        before(function(){
            return new Promise((resolve, reject) => {
                Users.register("Mike", "Jones", "mike.jones@example.com", "I<3CatsNotDogs")
                .catch(reject).then((user)=>{
                    mike = user;
                    user.validated = true;
                    user.save().then(resolve).catch(reject);
                });
            });
        });
        
        after(function(){
            return Users.remove(mike.id, "I<3CatsNotDogs");
        });
        
        it("can throw when generating tokens with invalid inputs (id)(no exist)", function(){
            return new Promise((resolve, reject) => {
                Users.genToken("123456781234567812345678", "sockauth", Date.now()+300*1000).catch((err)=>{
                    assert.ok(err);
                    console.log(err);
                    resolve();
                }).then((token)=>{
                    assert.ifError(token, "Invalid input passed gen");
                }).catch(reject);
            });
        });
    
        it("can throw when generating tokens with invalid inputs (id)(invalid)", function(){
            return new Promise((resolve, reject) => {
                Users.genToken(1234, "sockauth", Date.now()+300*1000).catch((err)=>{
                    assert.ok(err);
                    console.log(err);
                    resolve();
                }).then((token)=>{
                    assert.ifError(token, "Invalid input passed gen");
                }).catch(reject);
            });
        });
        
        it("can throw when generating tokens with invalid inputs (id)(undefined)", function(){
            return new Promise((resolve, reject) => {
                Users.genToken(undefined, "sockauth", Date.now()+300*1000).catch((err)=>{
                    assert.ok(err);
                    console.log(err);
                    resolve();
                }).then((token)=>{
                    assert.ifError(token, "Invalid input passed gen");
                }).catch(reject);
            });
        });
        
        it("can throw when generating tokens with invalid inputs (purpose)(invalid)", function(){
            return new Promise((resolve, reject) => {
                Users.genToken(mike.id, "invalid", Date.now()+300*1000).catch((err)=>{
                    assert.ok(err);
                    console.log(err);
                    resolve();
                }).then((token)=>{
                    assert.ifError(token, "Invalid input passed gen");
                }).catch(reject);
            });
        });
        
        it("can throw when generating tokens with invalid inputs (purpose)(blank)", function(){
            return new Promise((resolve, reject) => {
                Users.genToken(mike.id, "", Date.now()+300*1000).catch((err)=>{
                    assert.ok(err);
                    console.log(err);
                    resolve();
                }).then((token)=>{
                    assert.ifError(token, "Invalid input passed gen");
                }).catch(reject);
            });
        });
        
        it("can throw when generating tokens with invalid inputs (purpose)(undefined)", function(){
            return new Promise((resolve, reject) => {
                Users.genToken(mike.id, undefined, Date.now()+300*1000).catch((err)=>{
                    assert.ok(err);
                    console.log(err);
                    resolve();
                }).then((token)=>{
                    assert.ifError(token, "Invalid input passed gen");
                }).catch(reject);
            });
        });
        
        it("wont throw generating tokens with invalid inputs (expires)(invalid)", function(){
            return new Promise((resolve, reject) => {
                Users.genToken(mike.id, "sockauth", "potato").then((token)=>{
                    assert.ok(token, "invalid date did not generate token");
                    resolve();
                }).catch(reject).catch(reject);
            });
        });
        
        it("wont throw generating tokens with invalid inputs (expires)(undefined)", function(){
            return new Promise((resolve, reject) => {
                Users.genToken(mike.id, "sockauth", undefined).then((token)=>{
                    assert.ok(token, "invalid date did not generate token");
                    resolve();
                }).catch(reject).catch(reject);
            });
        });
        
    });
    
    describe("Test useToken", function(){
    
        before(function(){
            return new Promise((resolve, reject) => {
                Users.register("Mike", "Jones", "mike.jones@example.com", "I<3CatsNotDogs")
                .catch(reject).then((user)=>{
                    mike = user;
                    user.validated = true;
                    user.save().then(()=>{
                        Users.genToken(mike.id, "sockauth", Date.now() + 300*1000).then((token)=>{
                            mike_token = token;
                            resolve();
                        }).catch(reject);
                    }).catch(reject);
                });
            });
        });
        
        after(function(){
            return Users.remove(mike.id, "I<3CatsNotDogs");
        });
        
        it("can throw when using tokens with invalid inputs (id)(no exist)", function(){
            return new Promise((resolve, reject) => {
                Users.useToken("123456781234567812345678", "sockauth", mike_token).catch((err)=>{
                    assert.ok(err);
                    console.log(err);
                    resolve();
                }).then((valid)=>{
                    assert.equals(valid, true, "Invalid input passed use");
                    assert.equals(valid, false, "Invalid input passed use (returned invalid instead of catch)");
                }).catch(reject);
            });
        });
    
        it("can throw when using tokens with invalid inputs (id)(invalid)", function(){
            return new Promise((resolve, reject) => {
                Users.useToken(1234, "sockauth", mike_token).catch((err)=>{
                    assert.ok(err);
                    console.log(err);
                    resolve();
                }).then((valid)=>{
                    assert.equals(valid, true, "Invalid input passed use");
                    assert.equals(valid, false, "Invalid input passed use (returned invalid instead of catch)");
                }).catch(reject);
            });
        });
        
        it("can throw when using tokens with invalid inputs (id)(undefined)", function(){
            return new Promise((resolve, reject) => {
                Users.useToken(undefined, "sockauth", mike_token).catch((err)=>{
                    assert.ok(err);
                    console.log(err);
                    resolve();
                }).then((valid)=>{
                    assert.equals(valid, true, "Invalid input passed use");
                    assert.equals(valid, false, "Invalid input passed use (returned invalid instead of catch)");
                }).catch(reject);
            });
        });
        
        it("wont throw when using tokens with invalid inputs (purpose)(invalid)", function(){
            return new Promise((resolve, reject) => {
                Users.useToken(mike.id, "invalid", mike_token).then((valid)=>{
                    assert.equals(valid, false, "invalid purpose was usable?");
                    resolve();
                }).catch(reject).catch(reject);
            });
        });
        
        it("wont throw when using tokens with invalid inputs (purpose)(blank)", function(){
            return new Promise((resolve, reject) => {
                Users.useToken(mike.id, "", mike_token).then((valid)=>{
                    assert.equals(valid, false, "invalid purpose was usable?");
                    resolve();
                }).catch(reject).catch(reject);
            });
        });
        
        it("wont throw when using tokens with invalid inputs (purpose)(undefined)", function(){
            return new Promise((resolve, reject) => {
                Users.useToken(mike.id, undefined, mike_token).then((valid)=>{
                    assert.equals(valid, false, "invalid purpose was usable?");
                    resolve();
                }).catch(reject).catch(reject);
            });
        });
        
        it("wont throw using tokens with invalid inputs (token)(invalid)", function(){
            return new Promise((resolve, reject) => {
                Users.genToken(mike.id, "sockauth", "potato").then((valid)=>{
                    assert.equals(valid, false, "invalid token was usable?");
                    resolve();
                }).catch(reject).catch(reject);
            });
        });
        
        it("wont throw using tokens with invalid inputs (token)(undefined)", function(){
            return new Promise((resolve, reject) => {
                Users.genToken(mike.id, "sockauth", undefined).then((valid)=>{
                    assert.equals(valid, false, "invalid token was usable?");
                    resolve();
                }).catch(reject).catch(reject);
            });
        });
        
    });
    
});
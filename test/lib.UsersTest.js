const assert = require("assert");
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
var Users;
var mike;

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
        
    });
    
    describe("Test Register", function(){
    
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
    
        before(function(done){
            Users.register("Mike", "Jones", "mike.jones@example.com", "I<3CatsNotDogs")
            .catch(assert.ifError).then((user)=>{
                mike = user;
                user.validated = true;
                user.save(done);
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
    
        before(function(done){
            Users.register("Mike", "Jones", "mike.jones@example.com", "I<3CatsNotDogs")
            .catch(assert.ifError).then((user)=>{
                mike = user;
                user.validated = true;
                user.save(done);
            });
        });
        
        after(function(){
            return Users.remove(mike.id, "I<3CatsNotDogs");
        });
    
        it("can throw when removing a user with invalid credentials (id)(no exist)", function(){
            return new Promise((resolve, reject) => {
                Users.remove(1234, "I<3CatsNotDogs").catch((err)=>{
                    assert.ok(err);
                    console.log(err);
                    resolve();
                }).then((user)=>{
                    assert.ifError(user, "Invalid credentials passed login");
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
                    assert.ifError(user, "Invalid credentials passed login");
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
                    assert.ifError(user, "Invalid credentials passed login");
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
                    assert.ifError(user, "Invalid credentials passed login");
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
                    assert.ifError(user, "Invalid credentials passed login");
                }).catch(reject);
            });
        });
        
    });
    
    describe("Test Get", function(){
    
        before(function(done){
            Users.register("Mike", "Jones", "mike.jones@example.com", "I<3CatsNotDogs")
            .catch(assert.ifError).then((user)=>{
                mike = user;
                user.validated = true;
                user.save(done);
            });
        });
        
        after(function(){
            return Users.remove(mike.id, "I<3CatsNotDogs");
        });
    
        it("can throw when getting a user with invalid credentials (search)(no exist)", function(){
            return new Promise((resolve, reject) => {
                Users.get("nobody@example.com").catch((err)=>{
                    assert.ok(err);
                    console.log(err);
                    resolve();
                }).then((user)=>{
                    assert.ifError(user, "Invalid credentials passed login");
                }).catch(reject);
            });
        });
        
        it("can throw when getting a user with invalid credentials (search)(no exist)", function(){
            return new Promise((resolve, reject) => {
                Users.get(1234).catch((err)=>{
                    assert.ok(err);
                    console.log(err);
                    resolve();
                }).then((user)=>{
                    assert.ifError(user, "Invalid credentials passed login");
                }).catch(reject);
            });
        });
        
        it("can throw when getting a user with invalid credentials (search)(undefined)", function(){
            return new Promise((resolve, reject) => {
                Users.get(undefined).catch((err)=>{
                    assert.ok(err);
                    console.log(err);
                    resolve();
                }).then((user)=>{
                    assert.ifError(user, "Invalid credentials passed login");
                }).catch(reject);
            });
        });
        
    });
    
})
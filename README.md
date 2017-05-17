# Sandwich4Us
sandwich matching website for CITS3403

Check it out at https://sandwich4.us

# Installation
1. `git gud`

# Configuration

The folowing values can be changed in the `config.json` file.


Value|Default|Description
-----|-------|-----------
server.http.enabled     |`true`| whether to run a http server, if https is also true, it will just reditect http connections to the https server. This is ignored and assumed true if https is false.
server.http.port        |`3000`| port to run the http webserver on.
server.https.enabled    |`true`| whether to run a https server.
server.https.port       |`3001`| port to run the https webserver on.
server.https.cert       | `./certs/cert.pem`| file location of the ssl certificate.
server.https.key        | `./certs/key.pem`| file location of the ssl key.
database.mongo.host     |`ds141401.mlab.com`| hostname of the mongodb server
database.mongo.port     |`41401`| port of the mongo server
database.mongo.name     |`sandwich`| name of the mongo database database.mongo.user     |`public`| username of the mongo server user
database.mongo.password |`password`| password of the mongo server user
session.secret          |`onlytellyourcat`| Large secret string for sessions

# Roadmap
FE = Front End, BE = Back End, FS = Full Stack

 - [x] BE add config file
 - [x] BE add https
 - [ ] FE implement pure css
 - [ ] FE implement jquery
 - [ ] FE add sweat alert
 - [x] BE add handlebars
 - [ ] BE add load in for mongo
 - [ ] FS add socket.io
 - [ ] BE add Travis CI for unit testing

 - [ ] FS implement login/users
   - [ ] FE make registration form
   - [ ] FE make login form
   - [ ] BE implement mongo user database
   - [ ] BE implement sessions with mongo session store
   - [ ] FS add socket login calls / socket auth

 - [ ] FS implement match requests
   - [ ] FE Redo match request form
   - [ ] FE Make match browsing page
   - [ ] BE Add request mongo collection
   - [ ] FE get location of request
   - [ ] FS add socket calls for linking FE to BE db
   - [ ] BE generate formula to match requests

 - [ ] FS implement match messaging
   - [ ] FE add instant messaging interface
   - [ ] BE implement messaging collection
   - [ ] FS add socket calls for linking FE to BE db

 - [ ] FS Add user personalisation
   - [ ] FE Create profile page
   - [ ] FE Add code to edit page if owner
   - [ ] FS add socket calls for linking FE to BE db
   - [ ] FE Add links to profile in the navbar, match browser and messenger

 - [ ] FE add notifications (add to existing socket event handlers)
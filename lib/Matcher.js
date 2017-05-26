const {Schema} = require('mongoose');
const ingredients = require('./ingredients');
var ingredients_names = [];
for(let i in ingredients) ingredients_names.push(ingredients[i].name);

var requestSchema = new Schema({
    firstname: {
        type: String, 
        match: [/^[a-zA-Z][a-zA-Z -]+$/, "Invalid first name provided."],
        lowercase: true, 
        trim: true, 
        required: [true, "A first name is required."]
    },
    num_sandwiches: {
        type: Number, 
        min: [1, "Number of sandwiches provided is invalid, must be one or more."],
        max: [128, "Seriously? How many sandwiches do you need?"],
        required: [true, "Number of sandwiches is required."],
        set: v => Math.round(v)
    },
    dist: {
        type: Number, 
        min: [1, "Minimum allowed distance from you is 1km."],
        max: [300, "Maximum allowed distance from you is 300km."],
        required: [true, "Number of sandwiches is required."]
    },
    expires: {
        type: Date, 
        default: ()=>{return new Date(Date.now()+2*60*60*1000);}, 
        required: [true, "Request expiry time is required."],
        min: [new Date(), "Request expiry must be after the submition of the request, not before."],
        max: [new Date(Date.now()+7*24*60*60*1000), "Request expiry must be within a 7 days of the submition of the request."]
    },
    loc: {
        type: [Number],// [<longitude>, <latitude>]
        index: '2d'
    },
    want: [{
        type: [String, "Unknown ingredient given as a want."],
        enum: ingredients_names
    }],
    have: [{
        type: [String, "Unknown ingredient given as a have."],
        enum: ingredients_names
    }],
    owner: {
        type: [Schema.Types.ObjectId, "Invalid user"],
        required: [true, "Invalid user"]
    }
}, {timestamps: {}});

class Matcher {
    constructor(mongoose){
        this.mon = mongoose;
        this.request = mongoose.model('Request', requestSchema);
        this.socks = [];
    }
    
    newRequest(owner, firstname, num_sandwiches, dist, expires, long, lat, want, have){
        let self = this;
        return new Promise((resolve, reject) => {
            self.getRequestByOwner(owner).catch(reject).then( existing =>{
                if(existing) return self._update(existing, num_sandwiches, dist, expires, long, lat, want, have).catch(reject).then(resolve);
                
                if(!Array.isArray(want) || !Array.isArray(have)) return reject(["Invalid wants/haves given."]);
                for(let i in want){
                    if(have.indexOf(want[i]) !== -1){
                        return reject(["You cannot both have and want and ingredient. Make up your mind. " + want[i]]);
                    }
                }
                
                num_sandwiches = Number(num_sandwiches) || 0;
                dist = Number(dist) || 0;
                long = Number(long);
                lat = Number(lat);
                expires = new Date(expires);
                if(isNaN(long) || isNaN(lat)) return reject(["Invalid location provided."]);
                if(isNaN(expires.valueOf())) return reject(["Invalid end time provided."]);
                let newreq = new self.request({owner, firstname, num_sandwiches, dist, expires, loc: [long, lat], want, have});
                let valerr = newreq.validateSync();
                if(valerr){
                    var msgs = [];
                    for(var i in valerr.errors) msgs.push(valerr.errors[i].message);
                    return reject(msgs);
                }
                
                newreq.save((err)=>{
                    if(err){
                        console.error(err);
                        return reject(["An Unknown issue occured, please contact an admin. 5687"]);
                    }
                    resolve(newreq);
                    self.getMatches(owner, true);
                });
            });
        });
    }
    
    getRequestByOwner(search){
        let self = this;
        return new Promise((resolve, reject) => {
            if(!self.mon.Types.ObjectId.isValid(search) || (""+search).length !== 24){
                return resolve(null);
            }
            self.request.find({owner: search, expires: {$gt: new Date()}}, null, {limit: 1}, (err, reqs)=>{
                if(err){
                    console.error(err);
                    return reject(["An Unknown issue occured, please contact an admin. 8269"]);
                }
                if(reqs.length < 1) return resolve(null);
                resolve(reqs[0]);
            });
        });
    }
    
    getRequestById(id){
        let self = this;
        return new Promise((resolve, reject) => {
            if(!self.mon.Types.ObjectId.isValid(id) || (""+id).length !== 24){
                return resolve(null);
            }
            self.request.findById(id, (err, req)=>{
                if(err){
                    console.error(err);
                    return reject(["An Unknown issue occured, please contact an admin. 4932"]);
                }
                resolve(req);
            });
        });
    }
    
    _update(req, num_sandwiches, dist, expires, long, lat, want, have){
        let self = this;
        return new Promise((resolve, reject) => {
            if(!isNaN(Number(num_sandwiches))) req.num_sandwiches = Number(num_sandwiches);
            if(!isNaN(Number(dist))) req.dist = Number(dist);
            if(!isNaN(Number(long))) req.loc[0] = Number(long);
            if(!isNaN(Number(lat))) req.loc[1] = Number(lat);
            if(Array.isArray(want)) req.want = want;
            if(Array.isArray(have)) req.have = have;
            for(let i = 0; i < req.want.length; i++){
                if(req.have.indexOf(req.want[i]) !== 0){
                    return reject(["You cannot both have and want and ingredient. Make up your mind."]);
                }
            }
            expires = new Date(expires);
            if(!isNaN(expires.valueOf())) req.expires = expires;
            req.save().catch(reject).then(()=>resolve(req));
            self.getMatches(req.owner, true);
        });
    }
    
    addSocket(owner, socket){
        let self = this;
        self.socks.push([owner, socket]);
        socket.on('disconnect', ()=>{
            let ind = -1;
            for(let i in self.socks){
                if(self.socks[i][1].id === socket.id){
                    ind = i;
                    break;
                }
            }
            if(ind > -1) self.socks.splice(ind, 1);
        });
        socket.on('matches.get', ()=>{
            self.getMatches(owner);
        });
    }
    
    // pulled from the following stack overflow post and slightly modified: https://stackoverflow.com/a/21623206
    distance(loc1, loc2) {
        let p = 0.017453292519943295; // Math.PI / 180
        let c = Math.cos;
        let a = 0.5 - c((loc2[1] - loc1[1]) * p)/2 + 
            c(loc1[1] * p) * c(loc2[1] * p) * 
            (1 - c((loc2[0] - loc1[0]) * p))/2;
    
        return 12742 * Math.asin(Math.sqrt(a)); // 2 * R; R = 6371 km
    }
    
    getMatches(owner, updateOthers=false){
        let self = this;
        self.getRequestByOwner(owner).catch(console.error).then(req => {
            if(!req) return;
            self.request.find({
                loc: {$near: req.loc, $maxDistance: req.dist * 2000},
                expires: {$gt: new Date()}
            }).limit(100).catch(console.error).then(matches => {
                let scores = {};
                for(let i in matches){
                    if(matches[i].id === req.id){
                        scores[matches[i].id] = -100;
                        continue;
                    } 
                    let p1 = 0;
                    let p2 = 0;
                    let d = self.distance(req.loc, matches[i].loc);
                    let nd1 = d / req.dist;
                    let nd2 = d / matches[i].dist;
                    
                    for(let j in req.want){
                        if(matches[i].have.indexOf(req.want[j]) !== -1) p1++;
                    }
                    p1 = p1/req.want.length;
                    if(p1 === Infinity) p1 = 1;
                    for(let j in matches[i].want){
                        if(req.have.indexOf(matches[i].want[j]) !== -1) p2++;
                    }
                    p2 = p2/matches[i].want.length;
                    if(p2 === Infinity) p2 = 1;
                    
                    scores[matches[i].id] = 1 - (nd1 - nd1*p1 + nd2 - nd2*p2)/2;
                }
                if(matches.length > 1) matches.sort((a, b) => {
                    return scores[b.id] - scores[a.id];
                });
                var rematches = [];
                for(let i = 0; i < matches.length && i < 20; i++){
                    if(scores[matches[i].id] < 0) break; // outside of their distance
                    rematches.push({
                        id: matches[i].id,
                        firstname: matches[i].firstname,
                        loc: matches[i].loc,
                        distance: self.distance(req.loc, matches[i].loc),
                        score: scores[matches[i].id],
                        num_sandwiches: matches[i].num_sandwiches,
                        want: matches[i].want,
                        have: matches[i].have,
                        updatedAt: matches[i].updatedAt,
                        expires: matches[i].expires
                    });
                    if(updateOthers) self.getMatches(matches[i].owner);
                }
                for(let i in self.socks){
                    if(self.socks[i][0] == owner){
                        self.socks[i][1].emit('matches.list', rematches);
                    }
                }
            });
        });
    }
    
    getIngredients(owner, want, have){
        if(!Array.isArray(want)) want = [];
        if(!Array.isArray(have)) have = [];
        let self = this;
        return new Promise((resolve, reject) => {
            if(!self.mon.Types.ObjectId.isValid(owner) || (""+owner).length !== 24){
                return resolve(ingredients);
            }
            self.request.find({owner, expires: {$gt: new Date()}}, null, {limit: 1}, (err, reqs)=>{
                if(err){
                    console.error(err);
                    return reject(["An Unknown issue occured, please contact an admin. 4568"]);
                }
                if(reqs.length < 1) return resolve(ingredients);
                var new_ings = [];
                for(let i in ingredients){
                    new_ings.push({
                        name: ingredients[i].name,
                        tags: ingredients[i].tags,
                        want: 
                            reqs[0].want.indexOf(ingredients[i].name) !== -1 ||
                            want.indexOf(ingredients[i].name) !== -1,
                        have: 
                            reqs[0].have.indexOf(ingredients[i].name) !== -1 ||
                            have.indexOf(ingredients[i].name) !== -1
                    });
                }
                resolve(new_ings);
            });
        });
    }
    
}

module.exports = (m)=> new Matcher(m);
const {Schema} = require('mongoose');
const crypto = require('crypto');
var iterations = 10000;

var userSchema = new Schema({
    firstname: {
        type: String, 
        match: [/^[a-zA-Z][a-zA-Z -]+$/, "Invalid first name provided."],
        lowercase: true, 
        trim: true, 
        required: [true, "A first name is required."]
    },
    lastname: {
        type: String, 
        match: [/^[a-zA-Z][a-zA-Z -]+$/, "Invalid last name provided."], 
        lowercase: true, 
        trim: true, 
        required: [true, "A first name is required."]
    },
    email: {
        type: String, 
        match: [ //regex taken from the HTML5 standard
            /^[a-z0-9!#$%&'*+/=?^_`{|}~.-]+@[a-z0-9-]+(\.[a-z0-9-]+)*$/,
            "Invalid email address provided."
        ],
        lowercase: true, 
        trim: true, 
        required: [true, "An email address is required."], 
        unique: true
    },
    validated: {type: Boolean, default: false, required: true},
    tokens: [{
        token: {type: String, required: true},
        purpose: {type: String, required: true, enum: ["sockauth", "emailvalid"]},
        used: {type: Boolean, default: false, required: true},
        expires: {type: Date, default: ()=>{return new Date(Date.now()+24*60*60*1000);}, required: true}
    }],
    password: {
        salt: {type: String, required: true},
        hash: {type: String, required: true},
    }
}, {timestamps: {}});

class Users {
    constructor(mongoose){
        this.mon = mongoose;
        this.user = mongoose.model('User', userSchema);
    }
    
    register(firstname, lastname, email, password){
        let self = this;
        return new Promise((resolve, reject) => {
            self.get(email).then((dupe)=>{
                console.log(dupe);
                if(dupe) return reject(["The email address provided has already been registered."]);
                if(typeof password !== 'string' || password.trim() === "" || password.trim().length < 8){
                    return reject(["Password is required, with a length of at least 8 characters"]);
                }
                password = password.trim();
                let salt = crypto.randomBytes(256).toString('hex');
                crypto.pbkdf2(password, salt, iterations, 512, 'sha512', (err, hash) => {
                    if(err){
                        console.error(err);
                        return reject(["An Unknown issue occured, please contact an admin. 3872"]);
                    }
                    let newuser = new self.user({firstname, lastname, email, password: {salt, hash}, validated: false, tokens: []});
                    let valerr = newuser.validateSync();
                    if(valerr){
                        var msgs = [];
                        for(var i in valerr.errors) msgs.push(valerr.errors[i].message);
                        return reject(msgs);
                    }
                    newuser.save((err)=>{
                        if(err){
                            console.error(err);
                            return reject(["An Unknown issue occured, please contact an admin. 5687"]);
                        }
                        resolve(newuser);
                    });
                });
            }).catch((err)=>{
                console.error(err);
                reject(["An Unknown issue occured, please contact an admin. 5932"]);
            });
        });
    }
    
    login(email, password){
        let self = this;
        return new Promise((resolve, reject) => {
            if(typeof password !== 'string' || password.trim() === "") return reject(["Password is required"]);
            password = password.trim();
            self.user.find({email}, null, {limit: 1}, (err, users)=>{
                if(err){
                    console.error(err);
                    return reject(["An Unknown issue occured, please contact an admin. 5478"]);
                }
                if(users.length < 1) return reject(["Invalid Email/Password."]);
                crypto.pbkdf2(password, users[0].password.salt, iterations, 512, 'sha512', (err, hash) => {
                    if(err){
                        console.error(err);
                        return reject(["An Unknown issue occured, please contact an admin. 4872"]);
                    }
                    if(hash !== users[0].password.hash) return reject(["Invalid Email/Password."]);
                    if(!users[0].validated) return reject(["The email address for this account is not yet validated, please check your email for the validation link."]);
                    resolve(users[0]);
                });
            });
        });
    }
    
    remove(id, password){
        let self = this;
        return new Promise((resolve, reject) => {
            if(typeof password !== 'string' || password.trim() === "") return reject(["Password is required"]);
            password = password.trim();
            self.user.findById(id, null, {limit: 1}, (err, users)=>{
                if(err){
                    console.error(err);
                    return reject(["An Unknown issue occured, please contact an admin. 6478"]);
                }
                if(users.length < 1) return reject(["Account does not exist, try refreshing the page or contacting an admin."]);
                crypto.pbkdf2(password, users[0].password.salt, iterations, 512, 'sha512', (err, hash) => {
                    if(err){
                        console.error(err);
                        return reject(["An Unknown issue occured, please contact an admin. 5872"]);
                    }
                    if(hash !== users[0].password.hash) return reject(["Invalid Password Provided."]);
                    self.user.findByIdAndRemove(id, (err)=>{
                        if(err){
                            console.error(err);
                            return reject(["An Unknown issue occured, please contact an admin. 7825"]);
                        }
                        resolve();
                    });
                });
            });
        });
    }
    
    get(search){
        let self = this;
        return new Promise((resolve, reject) => {
            let query = {email: search}; //assume email was passed
            if((""+search).indexOf('@') === -1) query = {_id: search}; //if no @, assume id was passed
            self.user.find(search, null, {limit: 1}, (err, users)=>{
                if(err){
                    console.error(err);
                    return reject(["An Unknown issue occured, please contact an admin. 5478"]);
                }
                if(users.length < 1) return resolve(null);
                resolve(users[0]);
            });
        });
    }
    
    genToken(id, purpose, expires){
        let self = this;
        return new Promise((resolve, reject) => {
            self.get(id).catch(reject).then((user)=>{
                if(!user) return reject(["User not Found. 6985"]);
                self._checkExpiredTokens(user);
                var token = crypto.randomBytes(128).toString('hex');
                user.tokens.push({token, purpose, used: false, expires});
                user.save().then(()=>{
                    resolve(token);
                }).catch((err)=>{
                    console.error(err);
                    reject(["An Unknown issue occured, please contact an admin. 7356"]);
                });
            });
        });
    }
    
    useToken(id, purpose, token){
        let self = this;
        return new Promise((resolve, reject) => {
            self.get(id).catch(reject).then((user)=>{
                if(!user) return reject(["User not Found. 6985"]);
                self._checkExpiredTokens(user);
                var found = false;
                for(var i in user.tokens){
                    if(
                        user.tokens[i].token === token 
                        && !user.tokens[i].used 
                        && user.tokens[i].expires < Date.now()
                        && user.tokens[i].purpose === purpose
                    ){
                        found = true;
                        user.tokens[i].used = true;
                        break;
                    }
                }
                user.save().then(()=>{
                    resolve(found);
                }).catch((err)=>{
                    console.error(err);
                    reject(["An Unknown issue occured, please contact an admin. 7469"]);
                });
            });
        });
    }
    
    
    _checkExpiredTokens(user){
        let toRemove = [];
        for(let i in user.tokens) if(user.tokens[i].expires < Date.now()) toRemove.push(i);
        for(let j in toRemove) user.tokens.splice(toRemove[j], 1);
    }
}

module.exports = (m)=> new Users(m);
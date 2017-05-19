const {Schema} = require('mongoose');
const crypto = require('crypto');

var userSchema = new Schema({
    firstname: {
        type: String, 
        match: [/[a-zA-Z][a-zA-Z -]+/, "Invalid first name provided."],
        lowercase: true, 
        trim: true, 
        required: [true, "A first name is required."]
    },
    lastname: {
        type: String, 
        match: [/[a-zA-Z][a-zA-Z -]+/, "Invalid last name provided."], 
        lowercase: true, 
        trim: true, 
        required: [true, "A first name is required."]
    },
    email: {
        type: String, 
        match: [ //regex taken from the HTML5 standard
            /[a-z0-9!#$%&'*+/=?^_`{|}~.-]+@[a-z0-9-]+(\.[a-z0-9-]+)*/,
            "Invalid email address provided."
        ],
        lowercase: true, 
        trim: true, 
        required: [true, "An email address is required."], 
        unique: [true, "The email address provided has already been registered."]
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
        return new Promise((resolve, reject) => {
            password = password.trim();
            if(password === "" || password.length < 8) return reject(["Password is required, with a length of at least 8 characters"]);
            let salt = crypto.randomBytes(256).toString('hex');
            crypto.pbkdf2(password, salt, 100000, 512, 'sha512', (err, hash) => {
                if(err){
                    console.error(err);
                    return reject(["An Unknown issue occured, please contact an admin. 3872"]);
                }
                let newuser = new this.user({firstname, lastname, email, password: {salt, hash}, validated: false, tokens: []});
                let valerr = newuser.validateSync();
                if(valerr){
                    var msgs = [];
                    for(var i in valerr.errors) msgs.push(valerr.errors[i].message);
                    return reject(msgs);
                }
                newuser.save().then(resolve).catch((err)=>{
                    console.error(err);
                    reject(["An Unknown issue occured, please contact an admin. 5687"]);
                });
            });
        });
    }
    
    login(email, password){
        return new Promise((resolve, reject) => {
            password = password.trim();
            if(password === "") return reject(["Password is required"]);
            this.user.find({email}, null, {limit: 1}, (err, users)=>{
                if(err){
                    console.error(err);
                    return reject(["An Unknown issue occured, please contact an admin. 5478"]);
                }
                if(users.length < 1) return reject(["Invalid Email/Password."]);
                crypto.pbkdf2(password, users[0].password.salt, 100000, 512, 'sha512', (err, hash) => {
                    if(err){
                        console.error(err);
                        return reject(["An Unknown issue occured, please contact an admin. 4872"]);
                    }
                    if(hash !== users[0].password.hash) return reject(["Invalid Email/Password."]);
                    resolve(users[0]);
                });
            });
        });
    }
}

module.exports = Users;
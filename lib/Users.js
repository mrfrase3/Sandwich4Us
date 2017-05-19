const {Schema} = require('mongoose');
const crypto = require('crypto');

var userSchema = new Schema({
    firstname: {type: String, match: /[a-zA-Z][a-zA-Z -]+/, lowercase: true, trim: true, required: true},
    lastname: {type: String, match: /[a-zA-Z][a-zA-Z -]+/, lowercase: true, trim: true, required: true},
    email: {type: String, match: /[a-zA-Z][a-zA-Z -]+/, lowercase: true, trim: true, required: true},
}, {timestamps: {}});
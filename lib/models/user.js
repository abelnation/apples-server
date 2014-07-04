'use strict';

var mongoose = require('mongoose');
var passportLocalMongoose = require('passport-local-mongoose');

var userSchema = mongoose.Schema({
    username: String,
    password: String,
    name: String,
    phone: String,
    email: String,
    creationDate: Date,
});

// enable passport support for user/pass auth
userSchema.plugin(passportLocalMongoose);

userSchema.statics.getByUsername = function (username, fn) {
    return this.find({ username: username }, function (err, users) {
        if (err) {
            return fn(err, null);
        }
        if (users && users.length >= 1) {
            return fn(err, users[0]);
        }
        return fn(err, null);
    });
};

var User = mongoose.model('User', userSchema);
module.exports = User;

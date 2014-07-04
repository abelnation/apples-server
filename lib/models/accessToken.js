/* jshint -W106 */
'use strict';

var log = require('../util/logger');
var mongoose = require('mongoose');
var hat = require('hat');

var AccessTokenSchema = new mongoose.Schema({
    token: { type: String },
    username: { type: String },
    expires: { type: Number },
});

AccessTokenSchema.statics.createTokenForUser = function (username, fn) {
    log.info("create token for: " + username);

    var now = (new Date()).getTime();
    var expires = now + (7 * 24 * 60 * 60 * 1000);
    //var expires = now + (30 * 1000);

    var token = new AccessToken({
        token: hat(128, 16),
        username: username,
        expires: expires,
    });

    token.save(function (err, token) {
        if (err) {
            log.error("error saving token: " + err);
            fn(err);
        }
        fn(null, token);
    });
};

var AccessToken = mongoose.model('AccessToken', AccessTokenSchema);

module.exports = AccessToken;

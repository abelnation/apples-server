'use strict';

var express = require('express');
var passport = require('passport');
var BearerStrategy = require('passport-http-bearer').Strategy;

var log = require('../../util/logger');

var User = require('../../models/user');
var AccessToken = require('../../models/accessToken');

var apiVersion01 = express.Router();

// Setup passport token bearer auth for authenticated api calls
passport.use(new BearerStrategy(
    // curl with:
    // -H "Authorization: Bearer <token>"
    function (accessToken, done) {
        AccessToken.findOne({ token: accessToken }, function (err, token) {
            if (err) { return done(err); }
            if (!token) { return done(null, false, { message: "invalid token" }); }

            log.debug("now          : " + (new Date()).getTime());
            log.debug("token.expires: " + token.expires);
            if (token.expires < (new Date()).getTime()) {
                log.debug("deleting access token: " + token._id);
                AccessToken.findById(token._id).remove(function (err) {
                    if (err) {
                        return done(err);
                    }
                    log.debug("access token deleted");
                    done(null, false, { message: "expired token" });
                });
                return;
            }

            User.findOne({ username: token.username }, function (err, user) {
                if (err) { return done(err); }
                if (!user) { return done(null, false); }
                // to keep this example simple, restricted scopes are not implemented,
                // and this is just for illustrative purposes
                var info = { scope: '*' };
                done(null, user, info);
            });
        });
    }
));

apiVersion01.use('/signin', require('./v01/signin'));
apiVersion01.use('/signout', require('./v01/signout'));
apiVersion01.use('/users', require('./v01/users'));
apiVersion01.use('/challenges', require('./v01/challenges'));
// apiVersion01.use('/oauth2', require('./v01/oauth2'));
// apiVersion01.use('/challenges', require('./v01/challenges'));

module.exports = apiVersion01;

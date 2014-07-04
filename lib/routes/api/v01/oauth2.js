/* jshint -W106 */
'use strict';

var express = require('express');
var passport = require('passport');

var log = require('../../../util/logger');

// var User = require('../../../models/user');
var oauthModels = require('../../../models/oauth2');
var Client = oauthModels.Client;
// var AuthorizationCode = oauthModels.AuthorizationCode;
// var AccessToken = oauthModels.AccessToken;

var oauth2 = require('../../../oauth2');
var router = express.Router();

function ensureLoggedIn () {
    return function (req, res, next) {
        if (!req.session.user || !req.session.user.id) {
            return res.redirect('/signin');
        }
        next();
    };
}

router.get('/authorize',
    passport.authenticate([ 'basic', 'oauth2-client-password' ], { session: false }),
    oauth2.authorization(function (clientID, redirectURI, done) {
        log.debug("clientID: " + clientID);
        Client.findById(clientID, function (err, client) {
            if (err) { return done(err); }
            if (!client) { return done(null, false); }
            if (client.redirect_uri !== redirectURI) { return done(null, false); }
            return done(null, client, redirectURI);
        });
    }),
    function (req, res) {
        res.json({
            transactionID: req.oauth2.transactionID,
            user: req.user,
            client: req.oauth2.client
        });
    }
);

router.post('/authorize/decision',
    ensureLoggedIn(),
    oauth2.decision()
);

router.post('/token',
    function (req, res, next) {
        log.debug("start");
        log.debug("headers: " + JSON.stringify(req.headers));
        next();
    },
    passport.authenticate([ 'basic', 'oauth2-client-password' ], { session: false }),
    function (req, res, next) {
        log.debug("authenticated");
        next();
    },
    oauth2.token(),
    function (req, res, next) {
        log.debug("post-token");
        next();
    },
    function (err, req, res, next) {
        log.debug("errors: " + JSON.stringify(err));
        next(err);
    },
    oauth2.errorHandler()
);

module.exports = router;

'use strict';

var express = require('express');

var log = require('../../../util/logger');
var passport = require('passport');
var AccessToken = require('../../../models/accessToken');

var signin = express.Router();

/*
curl -i \
    -X POST \
    -H "Content-Type: application/json" \
    -d '{ "username": "abel05", "password": "apples123" }' \
    http://ec2-107-22-117-7.compute-1.amazonaws.com:8080/api/1/signin
*/
signin.post('/', function (req, res) {
    if (req.session.user) {
        return res.json({ error: "User already logged in" });
    }

    log.debug("pre-authenticate");

    req.checkBody('username', 'Please enter a username').notEmpty();
    req.checkBody('password', 'Please enter a password').notEmpty();

    var errors = req.validationErrors();
    if (errors) {
        log.error("error: " + errors);
        res.json(400, {
            'errors': errors
        });
        return;
    }

    log.debug("pre-authenticate");

    passport.authenticate('local')(req, res, function () {
        AccessToken.createTokenForUser(req.user.username, function (err, token) {
            if (err) {
                res.json(400, {
                    'errors': errors
                });
                return;
            }
            res.json(201, {
                "id": req.user._id,
                "username": req.user.username,
                "token": token.token,
                "creationDate": req.user.creationDate,
            });
        });
    });
});

module.exports = signin;

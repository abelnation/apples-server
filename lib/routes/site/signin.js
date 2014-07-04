'use strict';

var express = require('express');

var log = require('../../util/logger');
var User = require('../../models/user');

var signin = express.Router();

signin.get('/', function (req, res) {
    if (req.session && req.session.username) {
        // already signed in
        res.redirect(301, '/');
    } else {
        res.render('signin', { username: req.session.username });
    }
});

signin.post('/', function (req, res) {

    log.debug("signin post");

    var username = req.body.username;
    if (!username) {
        return res.end("signin: PLEASE PROVIDE A USERNAME");
    }

    log.debug("creating user");
    User.getByUsername(username, function (err, user) {
        if (err) {
            return res.end("ERROR: " + err);
        }
        if (!user) {
            return res.end("signin: USERNAME NOT FOUND: " + username);
        }

        log.debug("user: " + JSON.stringify(user));

        // return res.end("signin: \n" + JSON.stringify(user) + "\nsession: " + JSON.stringify(req.session));
        req.session.username = user.username;

        log.debug("req: " + req);
        log.debug("session (signinexit): " + JSON.stringify(req.session));

        res.render('index', { user: user });
    });
});

module.exports = signin;

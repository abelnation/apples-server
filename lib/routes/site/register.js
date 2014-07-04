'use strict';

var express = require('express');
var log = require('../../util/logger');

var User = require('../../models/user');

var register = express.Router();

register.get('/', function (req, res) {
    res.render('register', { username: req.session.username });
});

register.post('/', function (req, res) {

    log.debug("register post");

    var username = req.body.username;
    if (!username) {
        return res.end("register: PLEASE PROVIDE A USERNAME");
    }

    log.debug("creating user");
    var user = new User({
        username: username,
        name: req.body.name,
        phone: req.body.phone
    });
    log.debug("saving user");
    user.save(function (err, savedUser) {
        log.debug("save callback");
        if (err) {
            res.end("ERROR: " + err);
        }

        log.debug("rendering template");
        req.session.username = savedUser.username;
        res.render('index', { user: savedUser });
    });
});

module.exports = register;

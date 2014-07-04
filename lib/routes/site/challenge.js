'use strict';

var express = require('express');
var log = require('../../util/logger');

// var User = require('../models/user');
// var Challenge = require('../models/challenge');

var challenge = express.Router();

challenge.get('/', function (req, res) {
    res.redirect(301, '/challenge/create');
});

challenge.get('/create', function (req, res) {
    res.render('challenge/create', { });
});

challenge.post('/', function (req, res) {
    log.debug("challenge post");
    res.end("challenge post");
});

module.exports = challenge;

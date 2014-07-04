'use strict';

var express = require('express');

var log = require('../../../util/logger');

var signout = express.Router();

signout.post('/', function (req, res) {
    // TODO: revoke user token
    log.info("Signing out");

    req.session = null;
    res.json(200, {
        "status": "ok"
    });
});

module.exports = signout;

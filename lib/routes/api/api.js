'use strict';

var express = require('express');
var log = require('../../util/logger');

var api = express.Router();

api.use('/1',
    require('./api_v1'),
    function (err, req, res, next) {
        log.debug("api_v1 error handler");
        if (err) {
            return res.json(400, {
                "errors": [ err ]
            });
        } else {
            next(err);
        }
    }
);

// default api
api.use('/', function (req, res) {
    res.redirect(301, '/api/1');
});

module.exports = api;

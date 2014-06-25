'use strict';

var express = require('express');

var logger = require('./util/logger');

var config = require('./config');
logger.debug("App config:");
logger.debug(JSON.stringify(config));

// var filters = require('./filters');

// configure app
var app = express();

if (config.env === 'dev') {
    // TODO: get yahoo-supported logger integrated
    // app.use(require('connect-logger')());
}

// configure middleware
// TODO

app.use(function(req, res) {
    res.write("Hello!\n");
    res.end();
});

if (config.env === 'dev') {
    app.use(require('errorhandler')());
}

app.listen(config.port);
logger.debug("Express server listening on port " + config.port);

module.exports = app;

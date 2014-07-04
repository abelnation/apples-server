'use strict';

var mongoose = require('mongoose');
var log = require('./util/logger');

log.info("Starting mongo client");

mongoose.connect('mongodb://localhost/apples');
var db = mongoose.connection;

db.on('error', function () {
    log.fatal("Unable to start mongo client");
    process.exit();
});
db.once('open', function () {
    log.info("Mongo connection established.");
});

module.exports = db;

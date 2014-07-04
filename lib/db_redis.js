var log = require('./util/logger');
var redis = require('redis');

// var bcrypt = require('bcrypt');
log.info("Starting redis client");
var db = redis.createClient();

if (!db) {
    log.fatal("Unable to start redis client");
    process.exit();
}

module.exports = db;

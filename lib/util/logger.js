'use strict';

var log4js = require('log4js');
var config = require('../config');

// @TODO config log4js
/*
log4js.configure({
  appenders: [
    { type: 'console' },
    { type: 'file', filename: 'logs/cheese.log', category: 'cheese' }
  ]
});
*/

var logger = log4js.getLogger();
logger.setLevel(config.logLevel);

module.exports = logger;

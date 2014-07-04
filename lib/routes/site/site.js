'use strict';

var express = require('express');
// var log = require('../../util/logger');

var site = express.Router();

site.use('/register', require('./register'));
site.use('/signin', require('./signin'));
site.use('/signout', require('./signout'));
site.use('/challenge', require('./challenge'));
site.use('/', require('./index'));

module.exports = site;

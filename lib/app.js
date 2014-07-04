'use strict';

var express = require('express');
var session = require('cookie-session');
var httpLog = require('morgan');
var favicon = require('serve-favicon');
var bodyParser = require('body-parser');
var validator = require('express-validator');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
require('./util/validators'); // express validator custom validators
require('./util/sanitizers'); // express validator custom validators

var User = require('./models/user');
var AccessToken = require('./models/accessToken');

var db = require('./db'); // establish db connection

/* jshint -W098 */
var dust = require('dustjs-linkedin');
var cons = require('consolidate');

var log = require('./util/logger');

var config = require('./config');
log.debug("App config:");
log.debug(JSON.stringify(config));

// var filters = require('./filters');

// configure app
var app = express();

// set dust as template engine
app.engine('dust', cons.dust);
app.set('template_engine', 'dust');
app.set('view engine', 'dust');
app.set('views', __dirname +'/views');

app.use(require('response-time')(5));
app.set('json spaces', 2); // pretty print json responses

// configure auth (passport)
var User = require('./models/user');
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//
// Middleware
//
app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(httpLog('short'));
app.use(bodyParser.json());
app.use(validator());
app.use(session({
    //secret: "TqdYLAfoenryrmHhmbPoHXkjpkuUUvFZXVzPP7d7fBqvbuBHnG",
    name: 'app:sesh',
    keys: [ 'testkey_01' ],
}));
app.use(passport.initialize());
app.use(passport.session());

// Session rehydrating
app.use(function (req, res, next) {
    // DEBUG
    log.debug("session: " + JSON.stringify(req.session));
    next();
});
app.use(function (req, res, next) {

    // make session available to templates
    app.locals.session = req.session;

    // hydrate user session
    if (req.session && req.session.username) {
        log.debug("session username: " + req.session.username);
        User.getByUsername(req.session.username, function (err, user) {
            req.user = user;
            next();
        });
    } else {
        log.debug("no session username");
        next();
    }
});
app.use( bodyParser.urlencoded() ); // to support URL-encoded bodies e.g. post

//
// Routes
//
app.use('/api', require('./routes/api/api'));
app.use('/site', require('./routes/site/site'));

if (config.env === 'dev') {
    app.use(require('errorhandler')());
}

app.listen(config.port);
log.info("Express server listening on port " + config.port);

module.exports = app;

'use strict';

var express = require('express');
var Rx = require('rx');

var log = require('../../../util/logger');
var passport = require('passport');
var validator = require('express-validator').validator;
var errorHandler = require('./error').errorHandler;

var User = require('../../../models/user');
var AccessToken = require('../../../models/accessToken');

var users = express.Router();

/*
curl -i \
    -H "Authorization: Bearer $TOKEN" \
    http://ec2-107-22-117-7.compute-1.amazonaws.com:8080/api/1/users
*/
users.get('/',
    passport.authenticate('bearer', { session: false }),
    function (req, res) {
        log.info("get all users");

        Rx.Observable.fromNodeCallback(User.find.bind(User))({})
            .flatMap(function (userList) { return Rx.Observable.fromArray(userList); })
            // .map(function (user) { return user.toJson(); })
            .reduce(function (agg, user) { return agg.concat([ user ]); }, [])
            .subscribe(
                function (users) {
                    log.debug("users: " + JSON.stringify(users));
                    return res.json(200, users);
                },
                function (err) {
                    errorHandler.bind(res)(400, err);
                },
                function () {});
    });

/*
curl -i \
    -H "Authorization: Bearer $TOKEN" \
    http://ec2-107-22-117-7.compute-1.amazonaws.com:8080/api/1/users/<some id>
*/
users.get('/:id',
    passport.authenticate('bearer', { session: false }),
    function (req, res) {
        var userId = req.params.id;
        log.info("get user: " + userId);
        log.info("req by  : " + req.user._id.toString());

        if (req.user._id.toString() !== userId) {
            return errorHandler.bind(res)(401, {
                "name": "Unauthorized",
                "message": "Users can only request their own info"
            });
        }

        Rx.Observable.fromNodeCallback(User.findById.bind(User))(userId)
            .subscribe(
                function (user) {
                    log.debug("users: " + JSON.stringify(user));
                    return res.json(200, user);
                },
                function (err) {
                    errorHandler.bind(res)(400, err);
                },
                function () {});
    });

/*
curl -i \
    -X POST \
    -H "Content-Type: application/json" \
    -d '{ "username": "abel05", "password": "apples123", "phone": "713-557-4984", "email": "abel.allison@gmail.com", "name": "abel" }' \
    http://ec2-107-22-117-7.compute-1.amazonaws.com:8080/api/1/users
*/
users.post('/', function (req, res) {

    req.checkBody('username', 'Please enter a username').notEmpty();
    req.checkBody('username', 'Username can contain only numbers and letters').isAlphanumeric();

    req.checkBody('password', 'Please enter a password').notEmpty();
    req.checkBody('password', 'Password must be between 6 and 128 chars long').isLength(6, 128);
    req.checkBody('password', 'Password can contain only letters and numbers').isAlphanumeric();

    req.checkBody('name', 'Please enter a name').notEmpty();

    req.checkBody('email', 'Please enter an email').notEmpty();
    req.checkBody('email', 'Inavlid email').isEmail();

    req.checkBody('phone', 'Please enter a phone number').notEmpty();
    req.checkBody('phone', 'Please enter a phone number').isPhoneNumber();

    var errors = req.validationErrors();
    if (errors) { return errorHandler.bind(res)(404, errors); }

    var userInfo = {
        username: req.body.username,
        name: validator.trim(req.body.name),
        phone: validator.toCleanPhoneNumber(req.body.phone),
        email: req.body.email,
        creationDate: new Date(),
    };

    Rx.Observable.fromArray([ { 'userInfo': userInfo, 'password': req.body.password } ])
        .flatMap(function (userDict) {
            // Create user object in DB
            var newUser = new User(userDict['userInfo']);
            return Rx.Observable.fromNodeCallback(User.register.bind(User))(newUser, userDict['password']);
        })
        .flatMap(function (user) {
            // Create access token
            return Rx.Observable.fromNodeCallback(AccessToken.createTokenForUser.bind(AccessToken))(user.username);
        }, function (user, token) {
            // Zip user info together with token for response
            log.debug("token: " + JSON.stringify(token));
            return {
                "id": user._id,
                "username": user.username,
                "token": token.token,
                "creationDate": user.creationDate,
            };
        }).subscribe(
            function (user) {
                log.debug("onNext: " + JSON.stringify(user));

                // TODO: figure out how to do auth as part of streams
                passport.authenticate('local')(req, res, function () {
                    res.json(201, user);
                });
            },
            function (err) {
                errorHandler.bind(res)(400, err);
            },
            function () {});
});

module.exports = users;

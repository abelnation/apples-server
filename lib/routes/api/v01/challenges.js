'use strict';

var _ = require('underscore');
var express = require('express');
var Rx = require('rx');
var when = require('promised-io/promise');
var promisify = require('../../../util/promisify');

var log = require('../../../util/logger');
var passport = require('passport');
var errorHandler = require('./error').errorHandler;

var User = require('../../../models/user');
var Challenge = require('../../../models/challenge');
var Submission = require('../../../models/submission');

var challenges = express.Router();

// List all challenges
/*
curl -i \
    -H "Authorization: Bearer $TOKEN" \
    http://ec2-107-22-117-7.compute-1.amazonaws.com:8080/api/1/challenges
*/
challenges.get('/',
    passport.authenticate('bearer', { session: false }),
    function (req, res) {
        log.info("get all challenges");

        Rx.Observable.fromNodeCallback(Challenge.find.bind(Challenge))({})
            .flatMap(function (challengeList) { return Rx.Observable.fromArray(challengeList); })
            // .map(function (user) { return user.toJson(); })
            .reduce(function (agg, challenge) { return agg.concat([ challenge ]); }, [])
            .subscribe(
                function (challenges) {
                    log.debug("challenges: " + JSON.stringify(challenges));
                    return res.json(200, challenges);
                },
                function (err) {
                    errorHandler.bind(res)(400, err);
                },
                function () {});
    });

// Create Challenge
/*
curl -i \
    -X POST \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{ "description": "lets have some fun", "invitees": [ "abel04", "abel03" ] }' \
    http://ec2-107-22-117-7.compute-1.amazonaws.com:8080/api/1/challenges
*/
challenges.post('/',
    passport.authenticate('bearer', { session: false }),
    function (req, res) {

        log.debug("create challenge");
        log.debug("creator: " + req.user.username + " (" + req.user._id + ")");

        req.checkBody('description', 'Please enter a description').notEmpty();

        log.debug("req body: " + JSON.stringify(req.body));

        var inviteeUsernames = req.body.invitees;
        if (!inviteeUsernames) {
            inviteeUsernames = [];
        } else if ( Object.prototype.toString.call( inviteeUsernames ) !== '[object Array]' ) {
            return errorHandler.bind(res)(400, { "message": "invitees must be array of usernames" });
        }
        log.debug("inviteeUsernames: " + JSON.stringify(inviteeUsernames));

        var errors = req.validationErrors();
        if (errors) { return errorHandler.bind(res)(400, errors); }

        var challenge = Rx.Observable.fromArray([ new Challenge({
            creator: req.user._id,
            description: req.body.description,
            creationDate: new Date(),
            startDate: new Date(),
            invitees: [],
            endDate: new Date((new Date()).getTime() + (24 * 60 * 60 * 1000)),
            challengeState: "waiting",
            participants: [ req.user._id ],
            submissions: []
        }) ]);

        // Get id's of invitee usernames
        var invitees = Rx.Observable.fromArray(inviteeUsernames)
            .flatMap(function (invitee) {
                log.debug("retrieving username: " + invitee);
                return Rx.Observable.fromNodeCallback(User.findOne.bind(User))({ username: invitee });
            })
            .reduce(function (agg, user) { return agg.concat([ user._id ]); }, []);

        // Add invitee id's to challenge and save
        challenge.zip(invitees, function (challenge, invitees) {
                log.debug("zip");
                log.debug("challenge: " + JSON.stringify(challenge));
                log.debug("invitees: " + JSON.stringify(invitees));

                log.debug("setting: " + invitees);
                _.map(invitees, function (invitee) { challenge.invitees.push(invitee); });
                log.debug("is now: " + challenge.invitees);
                return challenge;
            })
            .flatMap(function (theChallenge) {
                log.debug("saving challenge: " + JSON.stringify(theChallenge));
                log.debug("obj: " + theChallenge);
                return Rx.Observable.fromNodeCallback(theChallenge.save.bind(theChallenge))();
            })
            .first()
            .subscribe(
                function (challenge) {
                    log.debug("challenge: " + JSON.stringify(challenge));
                    return res.json(200, challenge);
                },
                function (err) {
                    errorHandler.bind(res)(400, err);
                },
                function () {});
    });

/*
curl -i \
    -H "Authorization: Bearer $TOKEN" \
    http://ec2-107-22-117-7.compute-1.amazonaws.com:8080/api/1/challenges/<some id>
*/
challenges.get('/:id',
    passport.authenticate('bearer', { session: false }),
    function (req, res) {
        var challengeId = req.params.id;
        log.info("get challenge: " + challengeId);

        Challenge.findById(challengeId, function (err, challenge) {
            if (err) { return res.json(404, { 'errors': [ err ] }); }

            log.info("challenge retrieved: " + JSON.stringify(challenge));
            res.json(challenge.toJSON());
        });
    });

// Invite user to challenge
/*
curl -i \
    -X POST \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{ "invitee": "abel04" }' \
    http://ec2-107-22-117-7.compute-1.amazonaws.com:8080/api/1/challenges/<id>/invite
*/
challenges.post('/:id/invite',
    passport.authenticate('bearer', { session: false }),
    function (req, res) {
        var theChallenge,
            challengeId = req.params.id;

        log.debug("invite user to challenge: " + challengeId);
        log.debug("inviter: " + req.user.username + " (" + req.user._id + ")");

        req.checkBody('invitee', 'You must provide username to invite').notEmpty();
        req.checkBody('invitee', 'usernames can contain only numbers and letters').isAlphanumeric();

        var errors = req.validationErrors();
        if (errors) { return res.json(400, { 'errors': errors }); }

        // Find challenge by id
        var pChallenge = promisify(Challenge.findById, Challenge)(challengeId);

        // Find invited user
        var pUser = pChallenge.then(function (challenge) {
            theChallenge = challenge;

            log.debug("challenge creator: " + theChallenge.creator + "(" + typeof + theChallenge.creator + ")");
            log.debug("inviter id       : " + req.user._id + "(" + typeof + req.user._id + ")");

            // mongoose object id's must be compared with .equals() (not !==/===)
            if (!theChallenge.creator.equals(req.user._id)) {
                return when.defer().reject(new Error("User not authorized to invite"));
            }

            // find invited user
            return promisify(User.findOne, User)({ username: req.body.invitee });
        });

        var pSave = pUser.then(function (user) {
            // add user to invitees
            theChallenge.invitees.push(user._id);

            return promisify(theChallenge.save, theChallenge)();
        });

        pSave.then(function (challenge) {
            res.json(challenge.toJSON());
        },
        function (err) {
            if (err) { return res.json(404, { 'errors': [ err ] }); }
        });
    });

// Join Challenge
/*
curl -i \
    -X POST \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    http://ec2-107-22-117-7.compute-1.amazonaws.com:8080/api/1/challenges/<id>/join
*/
challenges.post('/:id/join',
    passport.authenticate('bearer', { session: false }),
    function (req, res) {
        var challengeId = req.params.id;

        log.debug("join challenge: " + challengeId);
        log.debug("joiner: " + req.user.username + " (" + req.user._id + ")");

        Challenge.findById(challengeId, function (err, challenge) {
            if (err) { return res.json(400, { 'errors': [ err ] }); }
            if (challenge.challengeState !== "waiting") {
                return res.json(400, { "errors": [ { "message": "challenge has already started" } ] });
            }
            if (challenge.invitees.indexOf(req.user._id) < 0) {
                return res.json(400, { "errors": [ { "message": "user was not invited to this challenge" } ] });
            }
            if (challenge.participants.indexOf(req.user._id) < 0) {
                return res.json(400, { "errors": [ { "message": "user has already accepted invite" } ] });
            }

            log.info("challenge retrieved: " + JSON.stringify(challenge));
            challenge.participants.push(req.user._id);
            challenge.save(function (err, challenge) {
                if (err) { return res.json(400, { 'errors': [ err ] }); }

                return res.json(challenge.toJSON());
            });
        });
    });

// Get submissions for a challenge
/*
curl -i \
    -H "Authorization: Bearer $TOKEN" \
    http://ec2-107-22-117-7.compute-1.amazonaws.com:8080/api/1/challenges/<id>/submissions
*/
challenges.get('/:id/submissions',
    passport.authenticate('bearer', { session: false }),
    function (req, res) {
        var challengeId = req.params.id;

        log.debug("join challenge: " + challengeId);
        log.debug("joiner: " + req.user.username + " (" + req.user._id + ")");

        Challenge.findById(challengeId, function (err, challenge) {
            if (err) { return res.json(404, { 'errors': [ err ] }); }
            if (challenge.participants.indexOf(req.user._id) < 0) {
                return res.json({ "errors": [ { "message": "user is not a participant in this challenge" } ] });
            }

            log.info("challenge retrieved: " + JSON.stringify(challenge));

            res.json(challenge.toJSON());
        });
    });

// Make a submission to a challenge
/*
curl -i \
    -X POST \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{ "invitee": "abel04" }' \
    http://ec2-107-22-117-7.compute-1.amazonaws.com:8080/api/1/challenges/<id>/join
*/
challenges.post('/:id/submissions',
    passport.authenticate('bearer', { session: false }),
    function (req, res) {
        var challengeId = req.params.id;

        log.debug("join challenge: " + challengeId);
        log.debug("joiner: " + req.user.username + " (" + req.user._id + ")");

        Challenge.findById(challengeId, function (err, challenge) {
            if (err) { return res.json(404, { 'errors': [ err ] }); }
            if (challenge.challengeState !== "started") {
                return res.json(400, { "errors": [ { "message": "challenge has not started (or has ended)" } ] });
            }
            if (challenge.participants.indexOf(req.user._id) < 0) {
                return res.json(400, { "errors": [ { "message": "user is not a participant in this challenge" } ] });
            }

            log.info("challenge retrieved: " + JSON.stringify(challenge));
            log.info("creating submission");

            var submission = new Submission({
                creator: req.user._id,
                creationDate: new Date(),
                comment: "STUB test comment",
                mediaType: "text"
            });

            submission.save(function (err, submission) {
                if (err) { return res.json(400, { 'errors': [ err ] }); }

                log.info("submission saved");
                challenge.submissions.push(submission._id);
                challenge.save(function (err /*, challenge*/) {
                    if (err) {
                        return res.json(400, { 'errors': [ err ] });
                    }

                    log.info("submissions saved to challenge");
                    res.json(submission.toJSON());
                });
            });
        });
    });

module.exports = challenges;

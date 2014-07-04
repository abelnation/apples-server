'use strict';

var _ = require('underscore');
var express = require('express');
var Rx = require('rx');
// var when = require('promised-io/promise');
// var promisify = require('../../../util/promisify');

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

        var errors = req.validationErrors();
        if (errors) { return errorHandler.bind(res)(400, errors); }

        var inviteeUsernames = req.body.invitees;
        if (!inviteeUsernames) {
            inviteeUsernames = [];
        } else if ( Object.prototype.toString.call( inviteeUsernames ) !== '[object Array]' ) {
            return errorHandler.bind(res)(400, { "message": "invitees must be array of usernames" });
        }
        log.debug("inviteeUsernames: " + JSON.stringify(inviteeUsernames));

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

        Rx.Observable.fromNodeCallback(Challenge.findById.bind(Challenge))(challengeId)
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

// Invite user to challenge
/*
curl -i \
    -X POST \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{ "invitees": [ "abel04" ] }' \
    http://ec2-107-22-117-7.compute-1.amazonaws.com:8080/api/1/challenges/<id>/invite
*/
challenges.post('/:id/invite',
    passport.authenticate('bearer', { session: false }),
    function (req, res) {
        var challengeId = req.params.id;

        log.debug("invite user to challenge: " + challengeId);
        log.debug("inviter: " + req.user.username + " (" + req.user._id + ")");

        var inviteeUsernames = req.body.invitees;
        if (!inviteeUsernames) {
            inviteeUsernames = [];
        } else if ( Object.prototype.toString.call( inviteeUsernames ) !== '[object Array]' ) {
            return errorHandler.bind(res)(400, { "message": "invitees must be array of usernames" });
        }
        log.debug("inviteeUsernames: " + JSON.stringify(inviteeUsernames));

        // Get id's of invitee usernames
        var invitees = Rx.Observable.fromArray(inviteeUsernames)
            .flatMap(function (invitee) {
                log.debug("retrieving username: " + invitee);
                return Rx.Observable.fromNodeCallback(User.findOne.bind(User))({ username: invitee });
            })
            .reduce(function (agg, user) { return agg.concat([ user._id ]); }, []);

        // Look up challenge
        Rx.Observable.fromNodeCallback(Challenge.findById.bind(Challenge))(challengeId)
            .first()
            .map(function (challenge) {
                if (!challenge.creator.equals(req.user._id)) {
                    throw new Error("User not authorized to invite");
                }
                return challenge;
            })
            .zip(invitees, function (challenge, invitees) {
                log.debug("zip");
                log.debug("challenge: " + JSON.stringify(challenge));
                log.debug("invitees: " + JSON.stringify(invitees));

                _.map(invitees, function (invitee) {
                    if (challenge.invitees.indexOf(invitee) !== -1) {
                        throw new Error("User already invited: " + invitee);
                    }
                    challenge.invitees.push(invitee);
                });

                return challenge;
            })
            .flatMap(function (challenge) {
                log.debug("saving challenge: " + JSON.stringify(challenge));
                log.debug("obj: " + challenge);
                return Rx.Observable.fromNodeCallback(challenge.save.bind(challenge))();
            })
            .first()
            .subscribe(
                function (challenge) {
                    log.debug("invite success");
                    log.debug("challenge: " + JSON.stringify(challenge));
                    return res.json(200, challenge);
                },
                function (err) {
                    errorHandler.bind(res)(400, err);
                },
                function () {});
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

        Rx.Observable.fromNodeCallback(Challenge.findById.bind(Challenge))(challengeId)
            .map(function (challenge) {
                // Error check
                if (challenge.challengeState !== "waiting") {
                    throw new Error("challenge has already started");
                }
                if (challenge.invitees.indexOf(req.user._id) < 0) {
                    throw new Error("user was not invited to this challenge");
                }
                if (challenge.participants.indexOf(req.user._id) < 0) {
                    throw new Error("user has already accepted invite");
                }
                return challenge;
            })
            .flatMap(function (challenge) {
                // add user to participants
                challenge.participants.push(req.user._id);
                return Rx.Observable.fromNodeCallback(challenge.save.bind(challenge))();
            })
            .subscribe(
                function (challenge) {
                    log.debug("challenge: " + JSON.stringify(challenge));
                    return res.json(200, challenge);
                },
                function (err) {
                    errorHandler.bind(res)(400, err);
                },
                function () {});

        // Challenge.findById(challengeId, function (err, challenge) {
        //     if (err) { return res.json(400, { 'errors': [ err ] }); }
        //     if (challenge.challengeState !== "waiting") {
        //         return res.json(400, { "errors": [ { "message": "challenge has already started" } ] });
        //     }
        //     if (challenge.invitees.indexOf(req.user._id) < 0) {
        //         return res.json(400, { "errors": [ { "message": "user was not invited to this challenge" } ] });
        //     }
        //     if (challenge.participants.indexOf(req.user._id) < 0) {
        //         return res.json(400, { "errors": [ { "message": "user has already accepted invite" } ] });
        //     }

        //     log.info("challenge retrieved: " + JSON.stringify(challenge));
        //     challenge.participants.push(req.user._id);
        //     challenge.save(function (err, challenge) {
        //         if (err) { return res.json(400, { 'errors': [ err ] }); }

        //         return res.json(challenge.toJSON());
        //     });
        // });
    });

// Start Challenge
/*
curl -i \
    -X POST \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    http://ec2-107-22-117-7.compute-1.amazonaws.com:8080/api/1/challenges/<id>/start
*/
challenges.post('/:id/start',
    passport.authenticate('bearer', { session: false }),
    function (req, res) {
        var challengeId = req.params.id;

        log.debug("start challenge: " + challengeId);

        Rx.Observable.fromNodeCallback(Challenge.findById.bind(Challenge))(challengeId)
            .map(function (challenge) {
                // Error check
                if (challenge.challengeState !== "waiting") {
                    throw new Error("challenge has already started");
                }
                if (!challenge.creator.equals(req.user._id)) {
                    throw new Error("only creator can start a challenge");
                }
                return challenge;
            })
            .flatMap(function (challenge) {
                // add user to participants
                challenge.challengeState = "started";
                return Rx.Observable.fromNodeCallback(challenge.save.bind(challenge))();
            })
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

// End Challenge
/*
curl -i \
    -X POST \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    http://ec2-107-22-117-7.compute-1.amazonaws.com:8080/api/1/challenges/<id>/end
*/
challenges.post('/:id/end',
    passport.authenticate('bearer', { session: false }),
    function (req, res) {
        var challengeId = req.params.id;

        log.debug("end challenge: " + challengeId);

        Rx.Observable.fromNodeCallback(Challenge.findById.bind(Challenge))(challengeId)
            .map(function (challenge) {
                // Error check
                if (challenge.challengeState !== "started") {
                    throw new Error("either has not started or has aleady ended");
                }
                if (!challenge.creator.equals(req.user._id)) {
                    throw new Error("only creator can end a challenge");
                }
                return challenge;
            })
            .flatMap(function (challenge) {
                // add user to participants
                challenge.challengeState = "ended";
                return Rx.Observable.fromNodeCallback(challenge.save.bind(challenge))();
            })
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

        log.info("submissions for challenge: " + challengeId);

        Rx.Observable.fromNodeCallback(Challenge.findById.bind(Challenge))(challengeId)
            .filter(function (challenge) {
                // Don't go through stages for empty submission array
                // NOTE: empty arrays will cause problems for flatmap.
                //       Using filter up front allows for cleaner logic
                //       Reduce gracefully handles the case where we don't
                //       emit anything

                log.debug("submissions length: " + challenge.submissions.length);
                return (challenge.submissions.length > 0);
            })
            .flatMap(function (challenge) {
                // pull challenge submissions out and convert to observable
                if (challenge.participants.indexOf(req.user._id) < 0) {
                    throw new Error("user is not a participant in this challenge");
                }

                log.debug("submissions: " + JSON.stringify(challenge.submissions));
                return Rx.Observable.fromArray(challenge.submissions);
            })
            .flatMap(function (submissionId) {
                // Retrieve submission objects from db
                log.debug("submission id: " + JSON.stringify(submissionId));
                if (submissionId) {
                    return Rx.Observable.fromNodeCallback(Submission.findById.bind(Submission))(submissionId);
                }
            })
            .reduce(function (agg, submission) {
                // Combine submissions into list
                return agg.concat([ submission ]);
            }, [])
            .subscribe(
                function (submissions) {
                    log.debug("submissions: " + JSON.stringify(submissions));
                    return res.json(200, submissions);
                },
                function (err) {
                    errorHandler.bind(res)(400, err);
                },
                function () {});
    });

// Make a submission to a challenge
/*
curl -i \
    -X POST \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{ "comment": "test comment!", "submissionType": "text" }' \
    http://ec2-107-22-117-7.compute-1.amazonaws.com:8080/api/1/challenges/<id>/submissions
*/
challenges.post('/:id/submissions',
    passport.authenticate('bearer', { session: false }),
    function (req, res) {
        var challengeId = req.params.id;

        log.debug("make submission: " + challengeId);
        log.debug("submitter: " + req.user.username + " (" + req.user._id + ")");

        req.checkBody('comment', 'Comment ').notEmpty();

        var errors = req.validationErrors();
        if (errors) { return errorHandler.bind(res)(400, errors); }

        log.debug("looking up challenge");
        Rx.Observable.fromNodeCallback(Challenge.findById.bind(Challenge))(challengeId)
            .map(function (challenge) {
                log.debug("map");
                if (challenge.challengeState !== "started") {
                    throw new Error("challenge has not started (or has ended)");
                }
                if (challenge.participants.indexOf(req.user._id) < 0) {
                    throw new Error("user is not a participant in this challenge");
                }
                return challenge;
            })
            .flatMap(function (challenge) {
                log.debug("creating submission for challenge: " + JSON.stringify(challenge));
                var submission = new Submission({
                    creator: req.user._id,
                    creationDate: new Date(),
                    comment: req.body.comment,
                    mediaType: req.body.submissionType,
                    // uploadContent: req.body.uploadContent,
                });

                return Rx.Observable.fromNodeCallback(submission.save.bind(submission))()
                    .map(function (result) { return result[0]; });
            }, function (challenge, submission) {
                log.debug("zipping challenge with submission: " + JSON.stringify(submission));
                return {
                    challenge: challenge,
                    submission: submission
                };
            })
            .flatMap(function (challengeAndSubmission) {
                log.debug("adding submission to challenge object");
                var challenge = challengeAndSubmission.challenge;
                var submission = challengeAndSubmission.submission;

                challenge.submissions.push(submission._id);
                return Rx.Observable.fromNodeCallback(challenge.save.bind(challenge))()
                    .map(function (result) { return result[0]; });
            })
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

module.exports = challenges;

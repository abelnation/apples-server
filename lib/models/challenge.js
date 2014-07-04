'use strict';

var mongoose = require('mongoose');
var User = require('./user');

var challengeStates = 'waiting started ended'.split(' ');

var challengeSchema = mongoose.Schema({
    creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    description: String,
    invitees: [ { type: mongoose.Schema.Types.ObjectId, ref: 'User' } ], // usernames submitted by creator
    participants: [ { type: mongoose.Schema.Types.ObjectId, ref: 'User' } ],
    creationDate: Date,
    startDate: Date,
    endDate: Date,
    challengeState: { type: String, enum: challengeStates },
    submissions: [ { type: mongoose.Schema.Types.ObjectId, ref: 'Submission' } ],
});

challengeSchema.statics.getByCreator = function (creatorUsername, fn) {
    fn(new Error("TODO: implement"), null);
};

challengeSchema.methods.inviteUser = function (userId, fn) {
    if (this.challengeState !== "waiting") {
        return fn(new Error("Cannot invite once challenge has started"));
    }
    if (this.invitees.indexOf(userId) !== -1) {
        return fn(new Error("User already invited: " + userId));
    }

    User.findOne({ _id: userId }, function (err, user) {
        if (err) {
            return fn(new Error("User does not exist: " + userId));
        }
        this.invitees.push(user._id);
        this.save(function (err) {
            if (err) {
                return fn(new Error("Error inviting user: " + user._id));
            }

            fn(null, this);
        });
    });
};

challengeSchema.methods.acceptInvite = function (userId, fn) {
    if (this.challengeState !== "waiting") {
        return fn(new Error("Cannot accept once challenge has started"));
    }
    if (this.invitees.indexOf(userId) === -1) {
        return fn(new Error("User was never invited: " + userId));
    }

    User.findOne({ _id: userId }, function (err, user) {
        if (err) {
            return fn(new Error("User does not exist: " + userId));
        }
        this.participants.push(user._id);
        this.save(function (err) {
            if (err) {
                return fn(new Error("Error saving user invite accept: " + user._id));
            }

            fn(null, this);
        });
    });
};

challengeSchema.methods.start = function (fn) {
    if (this.challengeState !== "waiting") {
        return fn(new Error("Challenge has already started"));
    }

    this.challengeState = "started";
    this.save(function (err) {
        if (err) {
            return fn(new Error("Error starting challenge"));
        }

        fn(null, this);
    });
};

challengeSchema.methods.addSubmission = function (submission, fn) {
    this.submissions.push(submission);
    this.save(function (err) {
        if (err) {
            return fn(new Error("Error with submission"));
        }

        fn(null, this);
    });
};

challengeSchema.methods.end = function (fn) {
    if (this.challengeState !== "started") {
        return fn(new Error("Challenge has not started or has already ended"));
    }

    this.challengeState = "ended";
    this.save(function (err) {
        if (err) {
            return fn(new Error("Error ending challenge"));
        }

        fn(null, this);
    });
};

var Challenge = mongoose.model('Challenge', challengeSchema);
module.exports = Challenge;

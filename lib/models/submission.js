'use strict';

var mongoose = require('mongoose');

var mediaTypes = 'photo video text'.split(' ');

var submissionSchema = mongoose.Schema({
    creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    creationDate: Date,
    comment: String,
    mediaType: { type: String, enum: mediaTypes },
});

var Submission = mongoose.model('Submission', submissionSchema);
module.exports = Submission;

'use strict';

// var User = require('../models/user');

module.exports = function (req, res) {
    req.session = null;

    // already signed in
    res.redirect(301, '/');
};

'use strict';

module.exports = function (req, res) {
    var user = req.session.user;
    res.render('index', { user: user });
};

'use strict';

var expressValidator = require('express-validator');

// Phone validation
expressValidator.validator.extend('isPhoneNumber', function (str) {
    str = str.replace(/\D/g, "");
    return str.match(/\d{10}/);
});

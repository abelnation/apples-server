'use strict';

var expressValidator = require('express-validator');

expressValidator.validator.extend('toCleanPhoneNumber', function (str) {
    return str.replace(/\D/g, "");
});

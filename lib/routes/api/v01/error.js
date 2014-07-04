'use strict';

var log = require('../../../util/logger');

module.exports = {
    'errorHandler': function errorHandler (errorCode, err) {
        /*jshint validthis:true */
        log.error("error: " + err);
        this.json(errorCode, {
            'errors': [ {
                "message": err.toString(),
                "stack": err.stack
            } ]
        });
    }
};

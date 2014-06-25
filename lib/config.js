'use strict';

var env = process.env.NODE_ENV || 'dev';

var targets = {
    // local laptop development
    "local": {
        env: "local",
        port: 8080,
        logLevel: "TRACE",
    },
    // dev server
    "dev": {
        env: "dev",
        port: 8080,
        logLevel: "TRACE",
    },
    // prod server
    "prod": {
        env: "prod",
        port: 80,
        logLevel: "WARNING",
    }
};

module.exports = targets[env];

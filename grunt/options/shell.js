module.exports = function(grunt) {
    // var pkg = require('../helpers/read_package_helper')(grunt);
    var exports = {
        // no script tasks for now
        run_server: {
            options: {
                stdout: true,
                stderr: true,
            },
            command : 'nodemon index.js',
        },
        debug_server: {
            options: {
                stdout: true,
                stderr: true,
            },
            command : 'nodemon --debug index.js',
        },
        inspector: {
            options: {
                stdout: true,
                stderr: true,
            },
            command : 'node_modules/node-inspector/bin/inspector.js --web-port=4444',
        }
    };
    return exports;
};

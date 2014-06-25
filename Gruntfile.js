'use strict';

// Helpers
var loadConfig = require('./grunt/helpers/load_config_helper');

module.exports = function (grunt) {
    var pkg = require('./grunt/helpers/read_package_helper')(grunt);

    // Init grunt modules installed via npm (in package.json)
    require("load-grunt-tasks")(grunt);

    var config = {
        pkg: pkg,
        paths: pkg.paths,
        name: "<% pkg.title || pkg.name %>",
        banner: '/*! v<%= pkg.version %> */\n',
        env: process.env,
    };

    // Add all task config objects from ./grunt/options to our main config
    grunt.util._.extend(config, loadConfig(grunt, './grunt/options/'));
    grunt.initConfig(config);

    // Load all grunt tasks from folder ./grunt/tasks
    grunt.loadTasks('./grunt/tasks');

    // Task that is run when you execute just `grunt`
    // > grunt
    grunt.registerTask('default', [ 'watch' ]);
    grunt.registerTask('run_server', [ 'shell:run_server' ]);
};

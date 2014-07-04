'use strict';

module.exports = function(grunt) {
    var pkg = require('../helpers/read_package_helper')(grunt);
    return {
        options: {
            args: [ "--verbose" ],
            exclude: [ ".git*", "node_modules", ".DS_Store", ],
            recursive: true,
        },
        dev: {
            options: {
                src: ".",
                dest: "~/" + pkg.name,
                host: "ec2-user@" + pkg.hosts.dev,
                ssh: true,
                privateKey: "/Users/aallison/.ssh/apples-04.pem",
            }
        }
    };
};

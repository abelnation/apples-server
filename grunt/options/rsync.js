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
                host: pkg.hosts.dev,
                ssh: true,
            }
        }
    };
};

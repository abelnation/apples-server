module.exports = function(grunt) {
    return {
        lint: {
            files: [ '<%= jshint.src.src %>' ],
            tasks: [ 'jshint', 'jscs' ],
        },
        devrsync: {
            files: [
                './package.json',
                '<%= paths.src %>/**',
                '<%= paths.tests %>/**',
                '<%= paths.scripts %>/**',
            ],
            tasks: [ 'rsync:dev' ]
        },
        // sass: {
        //     files: '<%= pkg.paths.src %>/**/*.scss',
        //     tasks: [ 'sass' ]
        // }
    };
};


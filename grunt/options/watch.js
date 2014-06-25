module.exports = function(grunt) {
    return {
        lint: {
            files: [ '<%= jshint.src.src %>' ],
            tasks: [ 'jshint', 'jscs' ],
        },
        devrsync: {
            files: [
                './**',
                '!./node_modules/**',
                '!./.git/**',
            ],
            tasks: [ 'jshint', 'jscs', 'rsync:dev' ]
        },
        // sass: {
        //     files: '<%= pkg.paths.src %>/**/*.scss',
        //     tasks: [ 'sass' ]
        // }
    };
};


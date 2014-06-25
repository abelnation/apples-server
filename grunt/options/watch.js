module.exports = function(grunt) {
    return {
        lint: {
            files: [ '<%= jshint.src.src %>' ],
            tasks: [ 'jshint', 'jscs' ],
        },
        devrsync: {
            files: [
                '<%= pkg.paths.src %>/**',
                '<%= pkg.paths.config %>/**',
                '<%= pkg.paths.test %>/**'
            ],
            tasks: [ 'rsync:dev' ]
        },
        sass: {
            files: '<%= pkg.paths.src %>/**/*.scss',
            tasks: [ 'sass' ]
        }
    };
};


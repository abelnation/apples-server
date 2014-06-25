module.exports = function(grunt) {
    grunt.registerTask('lint', [ 'jshint', 'jscs', 'jsonlint' ]);
};

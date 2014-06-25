module.exports = function(grunt) {
    grunt.registerTask('run_server', [ 'shell:run_server' ]);
    grunt.registerTask('debug_server', [ 'shell:debug_server' ]);
    grunt.registerTask('inspector', [ 'shell:inspector' ]);
};

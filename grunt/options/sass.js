module.exports = function(grunt) {
    return {
        src: {
            options: {
                style: 'compressed',
                compass: true,
                // lineNumbers: true,
            },
            cwd: '<%= paths.src %>/public/scss/',
            expand: true,
            flatten: true,
            src: [
                '*.scss',
                '!**/_*.scss',
                '!partials/**/*.scss'
            ],
            dest: '<%= paths.src %>/public/css/',
            ext: '.css'
        },
    };
};


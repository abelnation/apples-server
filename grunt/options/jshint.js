module.exports = function(grunt) {
    return {
        gruntfile: {
            options: {
                "curly": true,
                "eqeqeq": true,
                "immed": true,
                "latedef": true,
                "newcap": true,
                "noarg": true,
                "sub": true,
                "undef": true,
                "unused": false,
                "boss": true,
                "eqnull": true,
                "node": true
            },
            src: 'Gruntfile.js'
        },
        src: {
            options: {
                jshintrc: '.jshintrc'
            },
            src: [
                '<%= paths.src %>/**/*.js'
            ]
        },
    };
};


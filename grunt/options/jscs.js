module.exports = function(grunt) {
    return {
        options: {
            config: ".jscs.jquery.json",
        },
        src: {
            files: {
                src: [ "<%= jshint.src.src %>" ]
            }
        },
    };
};


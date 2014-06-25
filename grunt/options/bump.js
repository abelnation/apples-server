module.exports = function(grunt) {
    return {
        options: {
            files: ['package.json'],
            updateConfigs: ['pkg'],
            commit: false,
            createTag: false,
            push: false,
            pushTo: 'origin',
        }
    };
};

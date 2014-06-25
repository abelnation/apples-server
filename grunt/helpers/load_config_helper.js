module.exports = function loadConfig(grunt, path) {
    var glob = require('glob');
    var object = {};
    var key;

    glob.sync('*.js', {cwd: path}).forEach(function(option) {
        key = option.replace(/\.js$/, '');
        console.log("../../" + path + key);
        object[key] = require("../../" + path + key)(grunt);
    });

    return object;
};


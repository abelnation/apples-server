// Loads grunt task config objects from config files
module.exports = function loadConfig(grunt, path) {
    var glob = require('glob');
    var object = {};
    var key;

    glob.sync('*.js', {cwd: path}).forEach(function(option) {
        key = option.replace(/\.js$/, '');
        console.log("Loading grunt task config: " + path + key + ".js");
        object[key] = require("../../" + path + key)(grunt);
    });

    return object;
};


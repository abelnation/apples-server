'use strict';

var when = require("promised-io/promise");

// pulled from: http://howtonode.org/promises
module.exports = function promisify (nodeAsyncFn, context) {
    return function () {
        // make our result promise object

        var defer = when.defer(),

        // from: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/slice
        // slice method can also be called to convert Array-like objects / collections to a new Array.
        // You just bind the method to the object. The arguments inside a function is an example of an
        // 'array-like object'.

        // convert arguments to array
        // these are the args for the inner fn (doesn't include nodeAsyncFn & context)
            args = Array.prototype.slice.call(arguments);

        // node fn's take a callback as their last argument
        // this inner function creates that callback for you
        // assumes it follows node conventions (err first, passed as last arg to function)
        // assumes callback takes a single result as second arg
        args.push(function (err, val) {
            if (err !== null) {
                return defer.reject(err);
            }

            return defer.resolve(val);
        });

        // call node fn with passed in this obj,
        nodeAsyncFn.apply(context || {}, args);

        return defer.promise;
    };
};

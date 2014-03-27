var http = require('http'),
    async = require('async'),
    API = require('./marketAPI');

var credentials = {
    password: 'immabot',
    email: 'a405312@drdrb.net'
};

// Do all the bullshit
async.series([

    function(callback) {
        API.login(credentials, callback);
    },
    function(callback) {
        API.placeOrder('STOCK-XNAS-ZNGA', 1000, 'Buy', callback);
    }
]);
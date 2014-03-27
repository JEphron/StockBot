var http = require('http'),
    async = require('async'),
    API = require('./marketAPI');

API.init({
    password: 'immabot',
    email: 'a405312@drdrb.net',
    gameName: 'testpleaseignore',
    gamePassword: 'nodejs'
});

// Do all the bullshit
async.series([

    function(callback) {
        API.login(callback);
    },
    // function(callback) {
    //     API.placeOrder('STOCK-XNAS-ZNGA', 550, 'Buy', callback);
    // },
    function(callback) {
        API.loadOrders(callback);
    },
    function(callback) {
        API.loadStats(callback);
    }

]);
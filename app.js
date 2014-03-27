var http = require('http'),
    async = require('async'),
    marketWatchAPI = require('./marketWatchAPI');

marketWatchAPI.init({
    password: 'immabot',
    email: 'a405312@drdrb.net',
    gameName: 'testpleaseignore',
    gamePassword: 'nodejs'
});

// Do all the bullshit
async.series([

    function(callback) {
        marketWatchAPI.login(callback);
    },
    function(callback) {
        marketWatchAPI.placeOrder('STOCK-XNAS-ZNGA', 550, 'Buy', callback);
    },
    function(callback) {
        marketWatchAPI.loadOrders(callback);
    },
    function(callback) {
        marketWatchAPI.loadStats(callback);
    }
]);
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
        var symbol = 'STOCK-XNAS-ZNGA';
        var shares = 550;
        var orderType = 'Buy';
        marketWatchAPI.placeOrder(symbol, shares, orderType, callback);
    },
    function(callback) {
        marketWatchAPI.loadOrders(callback);
    },
    function(callback) {
        marketWatchAPI.loadStats(callback);
    },
    function(callback) {
        marketWatchAPI.loadHoldings(function(err, holdings) {
            callback();
        });
    }
], function(err, result) {});
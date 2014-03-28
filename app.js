var http = require('http'),
    async = require('async'),
    marketWatchAPI = require('./marketWatchAPI'),
    stockDataAPI = require('./stockDataAPI'),
    database = require('./database');

marketWatchAPI.init({
    password: 'immabot',
    email: 'a405312@drdrb.net',
    gameName: 'testpleaseignore',
    gamePassword: 'nodejs'
});

var SYMBOLS = ["GOOG", "SNE", "AMZN", "RHT"]; // symbols to track
var TIMESTEP = 5 * 1000 * 60; // make trades every five minutes

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
    },
    function(callback) {
        stockDataAPI.getStockData(["ZNGA"], function(err, data) {
            console.log(data.ZNGA);
            callback();
        });
    }
], function(err, result) {});
// app.js
// Entrypoint for the application

var http = require('http'),
    async = require('async'),
    Sync = require('sync'),
    MWAccount = require('./marketWatchAccount'),
    stockBotEngine = require('./stockBotEngine'),
    databaseController = require('./database');

var TRACKEDSTOCKS = [{ // symbols to track
    symbol: "GOOG",
    exchange: "XNAS"
}, {
    symbol: "SNE",
    exchange: "NYQ"
}, {
    symbol: "AMZN",
    exchange: "XNAS"
}, {
    symbol: "RHT",
    exchange: "NYQ"
}];

var timestep = 1000 * 5; // make trades every x milliseconds
var stockBotEngine;
var accounts = [];

// This gets called for each symbol each timestep
// data is whatever's returned from the Yahoo Finance API
// call back with whatever action you want to perform in the format:
// {
//  dataSymbol: "STOCK-NYQ-SNE",
//  action: "buy" || "sell" || "short" || "none",
//  amount: 1000
// }
function onTimestep(data, callback) {
    console.log("--------")
    console.log(data.MIC);

    callback({
        dataSymbol: "STOCK-" + data.MIC + "-" + data.stockData.Symbol,
        action: "short",
        amount: 50
    });
}


async.series({
        initDB: function(next) {
            databaseController.init({
                trackedstocks: TRACKEDSTOCKS
            }, next);
        },

        createAccounts: function(next) {
            accounts.push(new MWAccount({
                password: 'immabot',
                email: 'a405312@drdrb.net',
                gameName: 'testpleaseignore',
                gamePassword: 'nodejs'
            }));
            /*
            ACCOUNTS.push(new MWAccount({
                password: 'abcd1234',
                email: 'nadrojj@mac.com',
                gameName: 'testpleaseignore',
                gamePassword: 'nodejs'
            }));
            */
            next();
        },

        initEngine: function(next) {
            stockBotEngine = new stockBotEngine({
                MWAccounts: accounts,
                db: databaseController,
                timestep: timestep
            }, next);
        }
        // ,test: function(next) {
        //     accounts[0].placeOrder("STOCK-NYQ-SNE", 10, "Sell", function() {});
        // }
    },
    function(err, results) { // Done
        stockBotEngine.on('timestep', onTimestep);
    })
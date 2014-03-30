// app.js
// Entrypoint for the application

var http = require('http'),
    async = require('async'),
    Sync = require('sync'),
    MWAccount = require('./marketWatchAccount'),
    StockBotEngine = require('./stockBotEngine'),
    databaseController = require('./database');

// Change this to whichever algorithm you decide to use
var onTimestep = require('./algorithms/basicTrader').onTimestep;

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

// Run all this setup bullshit in sync.
Sync(function() {
    databaseController.init.sync(null, {
        trackedstocks: TRACKEDSTOCKS
    });

    accounts.push(new MWAccount({
        password: 'immabot',
        email: 'a405312@drdrb.net',
        gameName: 'testpleaseignore',
        gamePassword: 'nodejs'
    }));

    // accounts.push(new MWAccount({
    //     password: 'abcd1234',
    //     email: 'nadrojj@mac.com',
    //     gameName: 'testpleaseignore',
    //     gamePassword: 'nodejs'
    // }));

    // accounts.push(new MWAccount({
    //     password: 'thisisapassword',
    //     email: 'aidanpieper@gmail.com',
    //     gameName: 'testpleaseignore',
    //     gamePassword: 'nodejs'
    // }));

    stockBotEngine = StockBotEngine.new.sync(null, {
        MWAccounts: accounts,
        db: databaseController,
        timestep: timestep
    });

    stockBotEngine.on('timestep', onTimestep);
})
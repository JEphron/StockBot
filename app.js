// app.js
// Entrypoint for the application

var http = require('http'),
    async = require('async'),
    Sync = require('sync'),
    MWAccount = require('./marketWatchAccount'),
    StockBotEngine = require('./stockBotEngine'),
    databaseController = require('./database'),
    schedule = require('node-schedule');

// Change this to whichever algorithm you decide to use
var algo = require('./algorithms/basicTrader');

var onTimestep = algo.onTimestep;
var onComplete = algo.onComplete;

var TRACKEDSTOCKS = [{ // symbols to track
        symbol: "GOOG",
        exchange: "XNAS"
    }
    // , {
    //     symbol: "SNE",
    //     exchange: "NYQ"
    // }, {
    //     symbol: "AMZN",
    //     exchange: "XNAS"
    // }, {
    //     symbol: "RHT",
    //     exchange: "NYQ"
    // }
];

var timestep = 1000 * 5; // make trades every x milliseconds
var stockBotEngine;
var accounts = [];


// 9:00 AM start
var startRule = new schedule.RecurrenceRule();
startRule.dayOfWeek = [1, 2, 3, 4, 5];
startRule.hour = 9;
startRule.minute = 0;

var start = schedule.scheduleJob(startRule, function() {
    stockBotEngine.tick();
});

// 4:00 PM end
var endRule = new schedule.RecurrenceRule();
endRule.dayOfWeek = [1, 2, 3, 4, 5];
endRule.hour = 12 + 4;
endRule.minute = 00;

var end = schedule.scheduleJob(endRule, function() {
    stockBotEngine.halt();
});

// Get it rollin'
Sync(function() {
    databaseController.init.sync(null, {
        trackedstocks: TRACKEDSTOCKS
    });

    accounts.push(new MWAccount({
        password: 'immabot',
        email: 'a405312@drdrb.net',
        gameName: 'testpleaseignore2',
        gamePassword: 'nodejs',
        db: databaseController
    }));

    // accounts.push(new MWAccount({
    //     password: 'abcd1234',
    //     email: 'nadrojj@mac.com',
    //     gameName: 'testpleaseignore',
    //     gamePassword: 'nodejs',
    //     db: databaseController
    // }));

    // accounts.push(new MWAccount({
    //     password: 'thisisapassword',
    //     email: 'aidanpieper@gmail.com',
    //     gameName: 'testpleaseignore',
    //     gamePassword: 'nodejs',
    //     db: databaseController
    // }));

    stockBotEngine = StockBotEngine.new.sync(null, {
        MWAccounts: accounts,
        db: databaseController,
        timestep: timestep
    });


    stockBotEngine.on('timestep', onTimestep);
    stockBotEngine.on('complete', onComplete);

})
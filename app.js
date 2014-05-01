// app.js
// Entrypoint for the application


// TODO:
//      Make it so that we don't overwrite the database every single fucking time
//      Should take days into account when calculating MA
//      An actual web interface would be pretty cool I guess

// mysql -u b870f4bf4082fe -p962be024 -h us-cdbr-east-05.cleardb.net heroku_2077dd96ba58fed

var http = require('http'),
    async = require('async'),
    Sync = require('sync'),
    MWAccount = require('./marketWatchAccount'),
    StockBotEngine = require('./stockBotEngine'),
    databaseController = require('./database'),
    schedule = require('node-schedule');

// Change this to whichever algorithm you decide to use
var algo = require('./algorithms/movingAvgTrader');

var onTimestep = algo.onTimestep;
var onComplete = algo.onComplete;

var TRACKEDSTOCKS = [{ // symbols to track
    symbol: "MSFT",
    exchange: "NSQ"
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

var timestep = 1000 * 60; // make trades every x milliseconds
var stockBotEngine;
var accounts = [];


// 9:05 AM start
var startRule = new schedule.RecurrenceRule();
startRule.dayOfWeek = [1, 2, 3, 4, 5];
startRule.hour = 9 + 4;
startRule.minute = 45;

var start = schedule.scheduleJob(startRule, function() {
    getTheShowOnTheRoad();
});

// 3:55 PM end
var endRule = new schedule.RecurrenceRule();
endRule.dayOfWeek = [1, 2, 3, 4, 5];
endRule.hour = 12 + 3 + 4;
endRule.minute = 55;

var end = schedule.scheduleJob(endRule, function() {
    stockBotEngine.halt();
});

// automatically start stockbot if starting between 9AM and 4PM
var date = new Date();
var current_hour = date.getHours() - 4; // timezoooooones

console.log(current_hour);

if (process.env.AUTOSTART && current_hour >= 9 && current_hour < 12 + 4)
    getTheShowOnTheRoad();


function getTheShowOnTheRoad() {
    Sync(function() {
        databaseController.init.sync(null, {
            trackedstocks: TRACKEDSTOCKS,
            URL: process.env.CLEARDB_DATABASE_URL,
            drop: !process.env.KEEP_DB_ON_START
        });


        // sequelize = new Sequelize(params.db || 'db', params.username || 'username', params.password || 'password', {
        //     dialect: params.dialect || "sqlite",
        //     storage: params.storage || './db/database.sqlite',
        //     logging: params.log || false
        // });


        accounts.push(new MWAccount({
            password: 'immabot',
            email: 'a405312@drdrb.net',
            gameName: process.env.MW_GAME_NAME || "testpleaseignore",
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
        console.log("STARTING");
        stockBotEngine.tick();

    })
}

console.log("StockBot locked and loaded...")
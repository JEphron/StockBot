var Sequelize = require('sequelize'),
    sequelize = new Sequelize('db', 'username', 'password', {
        dialect: "sqlite",
        storage: 'db/capturedData_day_5.sqlite'
    }),
    stockDataAPI = require('./yahooFinanceAPI'),
    async = require('async'),
    schedule = require('node-schedule');

var TrackedStock = sequelize.define('TrackedStock', {
    symbol: Sequelize.STRING,
    exchange: Sequelize.STRING
});

var Day = sequelize.define('Day', {
    DaysLow: Sequelize.FLOAT,
    DaysHigh: Sequelize.FLOAT,
    YearLow: Sequelize.FLOAT,
    YearHigh: Sequelize.FLOAT
});

var Snapshot = sequelize.define('Snapshot', {
    Ask: Sequelize.FLOAT,
    Bid: Sequelize.FLOAT,
    AskRealtime: Sequelize.FLOAT,
    BidRealtime: Sequelize.FLOAT,
    Change: Sequelize.FLOAT,
    ChangeRealtime: Sequelize.FLOAT,
    PercentChange: Sequelize.FLOAT,
    ChangeinPercent: Sequelize.FLOAT,
    LastTradePriceOnly: Sequelize.FLOAT,
    Timestamp: Sequelize.STRING

});

Day.hasMany(Snapshot);
TrackedStock.hasMany(Snapshot);
Snapshot.belongsTo(TrackedStock);
Snapshot.belongsTo(Day, {
    as: "Day"
});

sequelize.sync().success(function() {
    setupDatabase();
});

// var TIMESTEP = 5 * 1000 * 60;
var STOCKS = [{
    symbol: 'GOOG',
    exchange: 'XNAS'
}, {
    symbol: 'SNE',
    exchange: 'NYQ'
}, {
    symbol: 'AMZN',
    exchange: 'XNAS'
}, {
    symbol: 'RHT',
    exchange: 'NYQ',
}, {
    symbol: 'AAPL',
    exchange: 'XNAS',
}, {
    symbol: 'MSFT',
    exchange: 'XNAS',
}, {
    symbol: 'FB',
    exchange: 'XNAS'
}];

var TIMESTEP = 1000 * 60;

var stockNames = [];

var currentDay;

function setupDatabase() {
    //Create symbols for all of our stocks
    async.each(STOCKS, function(stock, done) {
        TrackedStock.findOrCreate({
            symbol: stock.symbol,
            exchange: stock.exchange
        }).success(function(symbol) {
            done();
        });
    }, function() {
        //Get just the names so we can do our Yahoo API calls
        for (var index in STOCKS) {
            stockNames[index] = STOCKS[index].symbol;
        }
        // Day.create({}).success(function(day) {
        //     currentDay = day;
        //     intervalObj = setInterval(function() {
        //         process.nextTick(function() {
        //             loop();
        //         });
        //     }, TIMESTEP);

        // });
    });
}

// 9:00 AM start
var startRule = new schedule.RecurrenceRule();
startRule.dayOfWeek = [1, 2, 3, 4, 5];
startRule.hour = 9;
startRule.minute = 0;

var intervalObj
var start = schedule.scheduleJob(startRule, function() {
    Day.create({}).success(function(day) {
        currentDay = day;

        intervalObj = setInterval(function() {
            process.nextTick(function() {
                loop();
            });
        }, TIMESTEP);
    });
});

// 4:00 PM end
var endRule = new schedule.RecurrenceRule();
endRule.dayOfWeek = [1, 2, 3, 4, 5];
endRule.hour = 12 + 4;
endRule.minute = 00;

var end = schedule.scheduleJob(endRule, function() {
    unLoop();
});


function loop() {
    //Get stock data
    stockDataAPI.getStockData(stockNames, function(err, stockData) {
        if (err) return console.log(err);

        //Loop through all of the stocks returned
        var stockDataArray = [];
        for (var i in stockData) {
            stockDataArray.push(stockData[i]);
        }
        console.log("number of stocks:", stockDataArray.length);
        async.each(stockDataArray, function(stock, done) {
            console.log("adding snapshot of symbol:", stock.Symbol);
            var currentdate = new Date();
            var datetime = currentdate.getDay() + "/" + currentdate.getMonth() + "/" + currentdate.getFullYear() + " @ " + currentdate.getHours() + ":" + currentdate.getMinutes() + ":" + currentdate.getSeconds();

            //Create a snapshot for each stock
            Snapshot.create({
                Ask: stock.Ask,
                Bid: stock.Bid,
                AskRealtime: stock.AskRealtime,
                BidRealtime: stock.BidRealtime,
                Change: stock.Change,
                ChangeRealtime: stock.ChangeRealtime,
                PercentChange: stock.PercentChange,
                ChangeinPercent: stock.ChangeinPercent,
                LastTradePriceOnly: stock.LastTradePriceOnly,
                Timestamp: datetime
            }).success(function(snapshot) {
                currentDay.addSnapshot(snapshot);
                TrackedStock.find({
                    where: {
                        symbol: stock.Symbol
                    }
                }).success(function(symbol) {
                    snapshot.setTrackedStock(symbol);
                    done();
                });
            }).error(function(err) {
                console.error("ERROR!", err);
                done();
            });
        });
    });
    // return setInterval(function() {
    //     process.nextTick(function() {
    //         loop();
    //     });
    // }, TIMESTEP);

}

function unLoop() {
    clearInterval(intervalObj);
}
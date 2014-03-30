var Sequelize = require('sequelize'),
    sequelize = new Sequelize('db', 'username', 'password', {
        dialect: "sqlite",
        storage: 'db/testDatabase.sqlite'
    }),
    stockDataAPI = require('./yahooFinanceAPI'),
    async = require('async');

var Symbol = sequelize.define('Symbol', {
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
    AskRealTime: Sequelize.FLOAT,
    BidRealTime: Sequelize.FLOAT,
    Change: Sequelize.FLOAT,
    ChangeRealtime: Sequelize.FLOAT,
    PercentChange: Sequelize.FLOAT,
    ChangeinPercent: Sequelize.FLOAT,
    LastTradePriceOnly: Sequelize.FLOAT

});

Day.hasMany(Snapshot);
Symbol.hasMany(Snapshot);
Snapshot.belongsTo(Symbol);
Snapshot.belongsTo(Day, {
    as: "Day"
});

sequelize.sync({
    force: true
}).success(function() {
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

var TIMESTEP = 5 * 1000;

var stockNames = [];

var currentDay;

function setupDatabase() {
    //Create symbols for all of our stocks
    async.each(STOCKS, function(stock, done) {
        Symbol.create({
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
        Day.create({}).success(function(day) {
            currentDay = day;
            loop();
        });

    });
}

function loop() {
    //Get stock data
    stockDataAPI.getStockData(stockNames, function(err, stockData) {
        //Loop through all of the stocks returned
        var stockDataArray = [];
        for (var i in stockData) {
            stockDataArray.push(stockData[i]);
        }
        async.each(stockDataArray, function(stock, done) {

            //Create a snapshot for each stock
            Snapshot.create({
                Ask: stock.Ask,
                Bid: stock.Bid,
                AskRealTime: stock.AskRealTime,
                BidRealTime: stock.BidRealTime,
                Change: stock.Change,
                ChangeRealtime: stock.ChangeRealtime,
                PercentChange: stock.PercentChange,
                ChangeinPercent: stock.ChangeinPercent,
                LastTradePriceOnly: stock.LastTradePriceOnly
            }).success(function(snapshot) {
                currentDay.addSnapshot(snapshot);
                Symbol.find({
                    where: {
                        symbol: stock.Symbol
                    }
                }).success(function(symbol) {
                    snapshot.setSymbol(symbol);
                });
            });
        });
    });

    setTimeout(function() {
        process.nextTick(function() {
            loop();
        });
    }, TIMESTEP);
}
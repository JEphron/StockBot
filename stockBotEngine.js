// stockBotEngine.js
// do the shit
var events = require('events'),
    stockDataAPI = require('./yahooFinanceAPI'),
    async = require('async');

function Engine(params, callback) {
    this.accounts = params.MWAccounts;
    this.orm = params.db;
    this.timestep = params.timestep;  
    this.masterAccount = params.MWAccounts[0];
    events.EventEmitter.call(this);
    var engine = this;
    async.series({
        one: engine.login.bind(this),
        two: engine.tick.bind(this),

    }, function() {
        process.nextTick(function() {
            callback();
        });
    });
};

Engine.prototype.__proto__ = events.EventEmitter.prototype;

Engine.prototype.login = function(callback) {
    async.eachSeries(this.accounts, function(account, next) {
        account.login(function() {
            next();
        });
    }, function() {
        console.log("done with login");
        callback();
    });
};

Engine.prototype.timestepActionCallback = function(params) {
    var action = params.action;
    if (action == "none")
        return;
    switch (action) {
        case 'buy':
            async.each(this.accounts, function(account, next) {
                account.placeOrder(params.dataSymbol, params.amount, 'buy', next)
            })
            break;
        case 'sell':
            async.each(this.accounts, function(account, next) {
                account.placeOrder(params.dataSymbol, params.amount, 'sell', next)
            })
            break;
        case 'short':
            async.each(this.accounts, function(account, next) {
                account.placeOrder(params.dataSymbol, params.amount, 'short', next)
            })
            break;
        default:
            break;
    }
};

Engine.prototype.generateLoadHistoricalStockData = function(stockSymbol) {
    var engine = this;
    return (function() {
        return function(index, callback) {
            engine.orm.db.Snapshot.count().success(function(snapshotCount) {
                engine.orm.db.TrackedStock.count().success(function(trackedStockCount) {
                    if ((snapshotCount / trackedStockCount) - index - 1 < 0) {
                        process.nextTick(function() {
                            callback();
                        });
                        return;
                    }
                    engine.orm.db.TrackedStock.find({
                        where: {
                            symbol: stockSymbol
                        }
                    }).success(function(trackedStock) {

                        trackedStock.getSnapshots({
                            sort: "id DESC",
                            offset: (snapshotCount / trackedStockCount) - index - 1,
                            limit: 1
                        }).success(function(snapshot) {
                            callback(null, snapshot);
                        }).error(function(err) {
                            console.log("ERROR", err);
                            return null;
                        });

                    });
                });
            });
        };
    })(stockSymbol);
};

// this is a mess...
Engine.prototype.tick = function(callback) {
    var data = {};
    var engine = this;

    var symbols = [];
    async.waterfall([
        // load a bunch of crap
        function(callback) {
            engine.orm.db.TrackedStock.findAll().success(function(stocks) {
                for (var i in stocks) symbols.push(stocks[i].symbol);
                stockDataAPI.getStockData(symbols, function(err, stockData) {
                    engine.masterAccount.getHoldings(function(err, holdings) {
                        callback(null, stocks, stockData, holdings);
                    });
                });
            });
        },
        function(stocks, stockData, holdings, callback) {
            // for each of the stocks we loaded
            for (var i in stockData) {
                var stock = stockData[i];
                // create a snapshot so we can do some analysis next tick
                // wrap it in a closure to preserve scope
                // this is disgusting.
                (function(stock) {
                    engine.orm.db.Snapshot.create({
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
                        engine.orm.db.TrackedStock.find({
                            where: {
                                symbol: stock.Symbol
                            }
                        }).success(function(trackedStock) {
                            snapshot.setTrackedStock(trackedStock);
                            // compose the data which will be sent along with the 'timestep' event
                            timestepdata = {};
                            timestepdata.stockData = stock;
                            timestepdata.holdings = [];
                            // insert the relevant holdings data
                            for (var j in holdings) {
                                if (holdings[j].symbol == stock.Symbol) {
                                    timestepdata.holdings.push(holdings[j]);
                                }
                            }
                            if (timestepdata.holdings.length == 0) {
                                timestepdata.holdings.push({
                                    error: "No Holdings for " + stock.Symbol
                                });
                            }
                            // insert the MIC
                            for (var j in stocks)
                                if (stocks[j].symbol == stock.Symbol) timestepdata.MIC = stocks[j].exchange;
                            timestepdata.dataSymbol = "STOCK-" + timestepdata.MIC + "-" + stock.Symbol;
                            // create the loadPrevious function, which will allow the use to retreive saved snapshots
                            timestepdata.loadPrevious = engine.generateLoadHistoricalStockData(stock.Symbol);
                            // finally, emit the event along with the data and callback
                            engine.emit('timestep', timestepdata, engine.timestepActionCallback.bind(engine));
                        });
                    });
                })(stock);

            }

        }

    ]);

    setTimeout(this.tick.bind(this), this.timestep);
    if (callback) callback();
};

module = module.exports = Engine;
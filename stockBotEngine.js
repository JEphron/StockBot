// stockBotEngine.js
// do the shit
var events = require('events'),
    stockDataAPI = require('./yahooFinanceAPI'),
    async = require('async');

function Engine() {};

// do this in a funky way in order to support sync object creation
Engine.new = function(params, callback) {
    var engine = new Engine();
    engine.accounts = params.MWAccounts;
    engine.orm = params.db;
    engine.timestep = params.timestep;  
    engine.masterAccount = params.MWAccounts[0];
    events.EventEmitter.call(engine);

    async.series({
        one: engine.login.bind(engine),
        two: engine.tick.bind(engine),

    }, function() {
        process.nextTick(function() {
            callback(null, engine);
        });
    });
}
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
            console.log("Buying", params.amount, "shares of", params.data.dataSymbol);
            async.each(this.accounts, function(account, next) {
                account.placeOrder(params.data.dataSymbol, params.amount, 'buy', next)
            })
            // create a new buy lot
            this.orm.db.Lot.create({
                sharesOwned: params.amount,
                priceAtTimeOfPurchase: params.data.stockData.AskRealTime,
                stopLimit: params.stopLimit,
                type: "buy"
            }).success(function(lot) {
                lot.setTrackedStock(params.data.stockObject);
            });
            break;
        case 'sell':
            console.log("Selling", params.amount, "shares of", params.data.dataSymbol);
            if (!params.lotToSell) {
                throw "param lotToSell must be specified in order to sell a lot";
            }
            params.lotToSell.sharesOwned -= params.amount;
            if (params.lotToSell.sharesOwned == 0) {
                params.lotToSell.destroy();
            } else if (params.lotToSell.sharesOwned < 0) {
                console.warn("\033[31mWARNING: Attempting to sell more than I have! I'll sell what I can, but don't be retarded in the future!");
                params.amount += params.lotToSell.sharesOwned;
                params.lotToSell.destroy();
            } else {
                params.lotToSell.save();
            }
            async.each(this.accounts, function(account, next) {
                account.placeOrder(params.data.dataSymbol, params.amount, 'sell', next)
            });
            break;
        case 'short':
            console.log("Shorting", params.amount, "shares of", params.data.dataSymbol);
            async.each(this.accounts, function(account, next) {
                account.placeOrder(params.data.dataSymbol, params.amount, 'short', next)
            });
            // create a new short lot
            this.orm.db.Lot.create({
                sharesOwned: params.amount,
                priceAtTimeOfPurchase: params.data.stockData.AskRealTime,
                stopLimit: params.stopLimit,
                type: "short"
            }).success(function(lot) {
                lot.setTrackedStock(data.stockObject);
            });

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
    // I hate everything about this function
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
        // // automatically sell lots that are below their stop-limits
        // function(stocks, stockData, holdings, callback) {
        //     // this will never ever happen unless I decide it should
        //     if (SHOULD_AUTOSELL_ON_BELOW_STOP_LIMIT) {
        //         // for each stock
        //         async.each(stocks, function(stock, done) {
        //             // get the lots for that stock
        //             stock.getLots().success(function(lots) {
        //                 // for each lot
        //                 async.each(lots, function(lot, done) {

        //                     if (stock.AskRealtime < lot.stopLimit) {
        //                         engine.timestepActionCallback(); // cheap hackery
        //                         lot.destroy().success(function() {

        //                             done();
        //                         }); // boom
        //                     }
        //                 }, done)
        //             });
        //         });
        //     } else {
        //         callback(null, stocks, stockData, holdings);
        //     }
        // },
        function(stocks, stockData, holdings, callback) {
            // for each of the stocks we loaded
            for (var i in stockData) {
                var currStockData = stockData[i];
                var stockDBObject;
                for (var j in stocks) {
                    if (stocks[j].symbol == currStockData.Symbol)
                        stockDBObject = stocks[j];
                }

                // create a snapshot so we can do some analysis next tick
                // wrap it in a closure to preserve scope
                // this is disgusting.
                (function(currStockData, stockDBObject) {
                    engine.orm.db.Snapshot.create({
                        Ask: currStockData.Ask,
                        Bid: currStockData.Bid,
                        AskRealTime: currStockData.AskRealTime,
                        BidRealTime: currStockData.BidRealTime,
                        Change: currStockData.Change,
                        ChangeRealtime: currStockData.ChangeRealtime,
                        PercentChange: currStockData.PercentChange,
                        ChangeinPercent: currStockData.ChangeinPercent,
                        LastTradePriceOnly: currStockData.LastTradePriceOnly
                    }).success(function(snapshot) {
                        engine.orm.db.TrackedStock.find({
                            where: {
                                symbol: currStockData.Symbol
                            }
                        }).success(function(trackedStock) {
                            snapshot.setTrackedStock(trackedStock);
                            // compose the data which will be sent along with the 'timestep' event
                            timestepdata = {};
                            timestepdata.stockData = currStockData;
                            timestepdata.holdings = [];
                            // insert the relevant holdings data
                            for (var j in holdings) {
                                if (holdings[j].symbol == currStockData.Symbol) {
                                    timestepdata.holdings.push(holdings[j]); // eight tabs in...
                                }
                            }
                            if (timestepdata.holdings.length == 0) {
                                timestepdata.holdings.push({
                                    error: "No Holdings for " + currStockData.Symbol // ballsack
                                });
                            }

                            // insert the MIC
                            timestepdata.MIC = stockDBObject.exchange;
                            timestepdata.dataSymbol = "STOCK-" + timestepdata.MIC + "-" + currStockData.Symbol;
                            // create the loadPrevious function, which will allow the use to retreive saved snapshots
                            timestepdata.loadPrevious = engine.generateLoadHistoricalStockData(currStockData.Symbol);
                            // bloaty bloaty blooo
                            timestepdata.stockObject = stockDBObject;
                            // find the lots that are associated with the stock symbol (symbol == stockDBObject == trackedStock == WHYYYY????) maximum redundancy level achieved
                            stockDBObject.getLots().success(function(lots) {
                                // I swear, if I have to add another fucking object to this shit...
                                timestepdata.lots = lots;
                                // finally, emit the event along with the data and callback. Whew.
                                engine.emit('timestep', timestepdata, engine.timestepActionCallback.bind(engine));
                            })
                        });
                    });
                })(currStockData, stockDBObject); // needs to be nuked from orbit
            }
        }
    ]);

    setTimeout(this.tick.bind(this), this.timestep);
    if (callback) callback();
};

module = module.exports = Engine;
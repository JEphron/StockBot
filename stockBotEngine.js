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
    engine.funds = params.funds;
    events.EventEmitter.call(engine);
    async.series({
        login: engine.login.bind(engine),
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

var TRANSACTION_FEE = 10;

Engine.prototype.timestepActionCallback = function(params) {
    var action = params.action;
    if (action == "none")
        return;
    var engine = this;

    switch (action) {
        case 'buy':
            console.log("Buying", params.amount, "shares of", params.data.dataSymbol);
            async.each(this.accounts, function(account, next) {
                account.placeOrder(params.data.dataSymbol, params.amount, 'buy', next)
            })

            engine.funds -= params.amount * params.data.stockData.AskRealtime - TRANSACTION_FEE;

            // if (engine.funds < 0) {
            //     // this needs to not happen. 
            //     console.error("\n\n\n YALL GOT FUCKED UP. \n\n\nFUNDS:", engine.funds, "TRADES:", snapshotIndex);
            //     process.exit();
            //     return;
            // }

            // create a new buy lot
            this.orm.db.Lot.create({
                sharesOwned: params.amount,
                priceAtTimeOfPurchase: params.data.stockData.AskRealtime,
                stopLimit: params.stopLimit,
                type: "buy"
            }).success(function(lot) {
                lot.setTrackedStock(params.data.stockObject);
            });
            if (params.cb)
                cb();
            break;
        case 'sell':
            // if the lot we're selling is a BUY lot then simply sell it
            // otherwise, if it's a SHORT lot, then buy to cover. 
            if (!params.lotToSell) {
                throw "param lotToSell must be specified in order to sell a lot";
            }

            // why does this happen?
            if (params.lotToSell.sharesOwned == 0) {
                params.lotToSell.destroy();
                break;
            }

            params.lotToSell.sharesOwned -= params.amount;

            if (params.lotToSell.sharesOwned == 0) {
                console.log("aaand we're done");
                params.lotToSell.destroy();
            } else if (params.lotToSell.sharesOwned < 0) {
                console.warn("\033[31mWARNING: Attempting to sell more than I have! I'll sell what I can, but don't be a such a silly fucker in the future!");
                params.amount += params.lotToSell.sharesOwned;
                params.lotToSell.destroy();
            } else {
                params.lotToSell.save();
            }


            var orderAction = "";

            if (params.lotToSell.type == "buy")
                orderAction = "sell";
            else if (params.lotToSell.type == "short")
                orderAction = "cover";

            async.each(this.accounts, function(account, next) {
                account.placeOrder(params.data.dataSymbol, params.amount, orderAction, next)
            });

            if (params.lotToSell.type == "buy") {
                var earned = params.amount * params.data.stockData.AskRealtime - TRANSACTION_FEE;
                engine.funds += earned;
                // console.log("earned", params.amount * params.data.stockData.AskRealtime - TRANSACTION_FEE, "funds:", funds);
            } else if (params.lotToSell.type == "short") {
                var earned = (params.lotToSell.priceAtTimeOfPurchase - params.data.stockData.AskRealtime) * params.amount - TRANSACTION_FEE;
                engine.funds += earned;
                // console.log("earned:", earned, "PATOP:", params.lotToSell.priceAtTimeOfPurchase, "curr ask:", params.data.stockData.AskRealtime);
            }
            if (params.cb)
                cb();
            break;
        case 'short': // WARNING: not fully supported

            console.log("Shorting", params.amount, "shares of", params.data.dataSymbol);
            async.each(this.accounts, function(account, next) {
                account.placeOrder(params.data.dataSymbol, params.amount, 'short', next)
            });
            // create a new short lot
            this.orm.db.Lot.create({
                sharesOwned: params.amount,
                priceAtTimeOfPurchase: params.data.stockData.AskRealtime,
                stopLimit: params.stopLimit,
                type: "short"
            }).success(function(lot) {
                lot.setTrackedStock(params.data.stockObject);
            });

            if (params.cb)
                cb();

            break;
        default:
            break;
    }
};

// stop the loop, emit the complete event for each remaining lot. Needs to be made more legit.
Engine.prototype.halt = function() {
    var engine = this;
    this.isRunning = false;
    if (!engine.timeoutObject)
        return console.log("SOME VOODOO SHIT HAPPENED RIGHT HERE");
    clearTimeout(engine.timeoutObject);
    engine.orm.db.Lot.findAll().success(function(lots) {
        console.log(lots);
        var data = {
            lots: lots
        }
        engine.emit('complete', data, engine.timestepActionCallback.bind(engine));
    })

}

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
                            offset: Math.floor((snapshotCount / trackedStockCount) - index - 1),
                            limit: 1
                        }).success(function(snapshot) {
                            callback(null, snapshot[0]);
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
    this.isRunning = true;

    // I hate everything about this function
    async.waterfall([
        // load a bunch of crap
        function(callback) {
            engine.orm.db.TrackedStock.findAll().success(function(stocks) {
                for (var i in stocks) symbols.push(stocks[i].symbol);
                stockDataAPI.getStockData(symbols, function(err, stockData) {
                    engine.masterAccount.getHoldings(function(err, holdings) {
                        engine.masterAccount.getStats(function(err, stats) {
                            callback(null, stocks, stockData, holdings, stats);
                        })
                    });
                });
            });
        },
        // // automatically sell lots that are below their stop-limits
        // function(stocks, stockData, holdings, stats, callback) {
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
        //         callback(null, stocks, stockData, stats, holdings);
        //     }
        // },
        function(stocks, stockData, holdings, stats, callback) {
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
                        AskRealtime: currStockData.AskRealtime,
                        BidRealtime: currStockData.BidRealtime,
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
                            // find out how much money we actually have left
                            if (stats['Cash Remaining']) { //not sure why this would break, but it does
                                timestepdata.funds = stats['Cash Remaining'].replace(/\$|\,/g, '');
                            } else {
                                console.error("Something went wrong with the stats fetch call. I have no idea what it was");
                                timestepdata.funds = engine.funds;
                            }
                            engine.funds = timestepdata.funds;

                            (function(timestepdata) {
                                // find the lots that are associated with the stock symbol (symbol == stockDBObject == trackedStock == WHYYYY????) maximum redundancy level achieved
                                stockDBObject.getLots().success(function(lots) {
                                    // I swear, if I have to add another fucking object to this shit...
                                    timestepdata.lots = lots;
                                    // finally, emit the event along with the data and callback. Whew.
                                    engine.emit('timestep', timestepdata, engine.timestepActionCallback.bind(engine));
                                })
                            })(timestepdata);
                        });
                    });
                })(currStockData, stockDBObject); // needs to be nuked from orbit
            }
        }
    ]);

    engine.timeoutObject = setTimeout(this.tick.bind(this), this.timestep);
    if (callback) callback();
};

module = module.exports = Engine;
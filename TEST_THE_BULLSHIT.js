// I don't even know what's in this file...
var async = require('async'),
    Sync = require('sync'),
    fs = require('fs'),
    orm = require('./database');

var onTimestep = require('./algorithms/basicTrader').onTimestep;
var fakeTrackedStock;

function preloadStockdata(cb) {
    var data = fs.readFileSync("./testData/msft-5min.txt", "utf8");
    var rows = data.split("\n");
    var snapshotsProcessed = 0;
    for (var i = 1; i < rows.length; i++) {
        var open = rows[i].split(",")[2];
        console.log(rows[i - 1])
        var prevOpen = rows[i - 1].split(",")[2];
        orm.db.Snapshot.create({
            Ask: open,
            AskRealTime: open,
            Change: open - prevOpen,
            ChangeRealtime: open - prevOpen,
            PercentChange: ((open - prevOpen) / prevOpen) * 100,
            LastTradePriceOnly: prevOpen
        }).success(function(snapshot) {
            fakeTrackedStock.addSnapshot(snapshot);
            snapshot.setTrackedStock(fakeTrackedStock);
            snapshotsProcessed++;
            console.log(snapshotsProcessed + "/" + rows.length);
            if (snapshotsProcessed == rows.length - 1) {
                console.log("DONE!");
                cb();
            }
        });
    };

};



function fakeActionCallback(params) {
    var action = params.action;
    if (action == "none")
        return;
    switch (action) {
        case 'buy':
            console.log("Buying", params.amount, "shares of", params.data.dataSymbol);
            orm.db.Lot.create({
                sharesOwned: params.amount,
                priceAtTimeOfPurchase: params.data.stockData.AskRealtime,
                stopLimit: params.stopLimit,
                type: "buy"
            }).success(function(lot) {
                lot.setTrackedStock(fakeTrackedStock);
            });
            funds -= params.amount * params.data.stockData.Ask;
            if (funds < 0) {
                console.error("\n\nYOU HAVE BECOME A PEASANT.\nPEASANTS CANNOT TRADE STOCKS.\nYOU HAVE LOST THE GAME.\n\n\nFUNDS:", funds, "TRADES:", snapshotIndex, "YOUR STATUS: [pleb]\n\n\n");
                process.exit();
                return;
            }

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

            funds += params.amount * params.data.stockData.Ask;
            break;
        case 'short':
            console.log("Shorting", params.amount, "shares of", params.data.dataSymbol);
            // create a new short lot
            this.orm.db.Lot.create({
                sharesOwned: params.amount,
                priceAtTimeOfPurchase: params.data.stockData.AskRealTime,
                stopLimit: params.stopLimit,
                type: "short"
            }).success(function(lot) {
                lot.setTrackedStock(fakeTrackedStock);
            });
            break;
        default:
            break;
    }
}


var snapshotIndex = 1;
var funds = 100000;
var snapshotCount;

function loop() {
    orm.db.Snapshot.find(snapshotIndex, {
        include: [orm.db.TrackedStock]
    }).success(function(snapshot) {
        var data = {};

        //exit();
        data.stockData = {
            Ask: snapshot.Ask,
            AskRealtime: snapshot.Ask,
            Change: snapshot.Change,
            LastTradePriceOnly: snapshot.LastTradePriceOnly,
            PercentChange: snapshot.PercentChange
        };
        data.loadPrevious = function(index, callback) {
            orm.db.Snapshot.count().success(function(snapshotCount) {
                orm.db.TrackedStock.count().success(function(trackedStockCount) {
                    if ((snapshotCount / trackedStockCount) - index - 1 < 0) {
                        process.nextTick(function() {
                            callback();
                        });
                        return;
                    }
                    orm.db.TrackedStock.find({
                        where: {
                            symbol: fakeTrackedStock.symbol
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
        }
        fakeTrackedStock.getLots().success(function(lots) {

            data.lots = lots;
            console.log("steppin", snapshotIndex, "funds:", funds);
            onTimestep(data, fakeActionCallback);

            if (snapshotIndex < snapshotCount) {
                snapshotIndex++;
                process.nextTick(function() {
                    loop();
                })
            } else {
                console.log("DONE!", funds);
            }
        });
    })
}
var TRACKEDSTOCKS = [{ // symbols to track
    symbol: "GOOG",
    exchange: "XNAS"
}];

Sync(function() {
    var reload = false;
    orm.init.sync(null, {
        drop: reload,
        trackedstocks: TRACKEDSTOCKS,
        storage: "./db/algoTestDatabase.sqlite",
        log: console.log
    });

    orm.db.TrackedStock.find(1).success(function(stock) {
        orm.db.Snapshot.count().success(function(c) {
            snapshotCount = c;
            fakeTrackedStock = stock;
            if (reload)
                preloadStockdata.sync(); // this takes mad long to execute
            loop();
        })

    })
});
var Sync = require('sync'),
    async = require('async');

var high = 0;
var low = 9999999999;

module.exports.onTimestep = function(data, callback) {
    var historicalSnapshots = [];
    var change = data.stockData.ChangeRealtime;
    var lots = data.lots;
    console.log(data.stockObject.symbol);
    var slowMA_PD = 2;
    var fastMA_PD = 1;
    var fastMovingAvg = 0;
    var slowMovingAvg = 0;
    var action = "none";

    async.series({
        loadSnapshots: function(cb) {
            async.times(slowMA_PD, function(i, next) {
                data.loadPrevious(i, next);
            }, function(err, snaps) {
                historicalSnapshots = historicalSnapshots.concat(snaps);
                cb();
            });
        },

        calculateMovingAverage: function(cb) {
            for (var i = 0; i < fastMA_PD; i++) {
                if (historicalSnapshots[i] == null)
                    return cb("meep");
                fastMovingAvg += historicalSnapshots[i].dataValues.AskRealtime;
            };
            fastMovingAvg /= fastMA_PD;

            for (var i = 0; i < slowMA_PD; i++) {
                if (historicalSnapshots[i] == null)
                    return cb("meep");
                slowMovingAvg += historicalSnapshots[i].dataValues.AskRealtime;
            };
            slowMovingAvg /= slowMA_PD;
            cb();
        },

        makeDecision: function(cb) {
            if (fastMovingAvg > slowMovingAvg) {
                action = "buy";
            } else if (fastMovingAvg < slowMovingAvg) {
                action = "short";
            }
            console.log('action:', action);
            cb();
        },

        executeBuys: function(cb) {
            var shouldBuy = (Math.random() * 10 < 5); // yeah
            if (shouldBuy) {
                process.nextTick(function() {
                    callback({
                        data: data,
                        action: action,
                        amount: 5, // ????
                        stopLimit: data.stockData.AskRealtime * 0.85 // gotta tweak this bitch (WARN: NOT USED)
                    });
                    cb();
                });
            }
        },

        executeSells: function(cb) {
            for (var i in lots) {
                var lot = lots[i];
                if (lot.type == "buy") {
                    if ((data.stockData.AskRealtime - lot.priceAtTimeOfPurchase) * lot.sharesOwned > 11) {
                        callback({
                            data: data,
                            action: "sell",
                            amount: lot.sharesOwned, // TODO: percentage based on angle of increase
                            lotToSell: lot
                        });
                    }
                } else if (lot.type == "short") {
                    if (lot.priceAtTimeOfPurchase - data.stockData.AskRealtime > 11) {
                        callback({
                            data: data,
                            action: "sell",
                            amount: lot.sharesOwned, // TODO: percentage based on angle of increase
                            lotToSell: lot
                        });
                    }
                }
            }
        }

    })

    if (data.funds < low)
        low = data.funds;
    if (data.funds > high)
        high = data.funds;
}

// When the day is over, sell off all remaining shares
module.exports.onComplete = function(data, callback) {

    var lots = data.lots;

    async.each(lots, function(lot, cb) {
        callback({
            data: data,
            action: "sell",
            amount: lot.sharesOwned,
            lotToSell: lot,
            callback: cb
        });
    }, function() {
        console.log("HIGH:", high, "LOW:", low);
    })
}
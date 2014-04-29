// A basic template for a trading algorithm

// Requirements...
var Sync = require('sync');

/** 
 * This function is called by the stockBotEngine
 * for each TrackedStock every timestep.
 * The data object which is received is structured as follows:
 * data = {
 *      stockData: {                        // Data returned from the finance API
 *          ...
 *      },
 *      holdings: [{...}, {...}],           // A list of holdings pertaining to the current symbol
 *      MIC:    'ABC',                      // The 3-4 letter code for the exchange
 *      dataSymbol: 'STOCK-ABC-DEF',        // The symbol that marketwatch uses to ID a particular stock
 *      lots: [...],                        // An array of sequelize data objects, these are the owned lots
 *      loadPrevious: function(index){...}  // A function which can be used to load snapshots of previous timesteps
 * }
 *
 * When the algorithm is finished processing data, the supplied callback can be invoked
 * in order to execute a decision.
 * The callback takes the following parameters as an object:
 * {
 *      data: data,                                     // The data that was passed to the function
 *      action: "Buy" || "Sell" || "Short" || "None",   // Select the action. Case insensitive
 *      amount: 1000,                                   // Number of shares to transact with
 *      stopLimit: -10.06                               // Point at which to sell, specified in percent difference
 *                                                          // from price of buy. Only needed when sending a Buy or Short order
 *
 * }
 */

var high = 0;
var low = 9999999999;

// This is some dumb cracker-ass fuckery right here
module.exports.onTimestep = function(data, callback) {
    var historicalSnapshots = [];
    var change = data.stockData.ChangeRealtime;
    var lots = data.lots;


    // // will attempt to load the last n previous snapshots so we can try to make educated decisions
    // // if we are less than n timesteps from the start of the program, 
    // // the results of queries with indices greater than the current timestep will be null
    // for (var i = 1; i < 5; i++) {
    //     // Execute the loadPrevious command in sync so we can be sure it'll return in time for us to use it after the loop
    //     Sync(function() {
    //         var prev = data.loadPrevious.sync(null, i);
    //         historicalSnapshots.push(prev);
    //     });
    // }

    if (data.funds < low)
        low = data.funds;
    if (data.funds > high)
        high = data.funds;


    // Randomly buy some sharez
    var shouldBuy = (Math.random() * 10 < 1); // such sophisticated algorithm

    if (shouldBuy) {
        process.nextTick(function() {
            callback({
                data: data,
                action: "buy",
                amount: 6, // ????
                stopLimit: data.stockData.AskRealtime * 0.85 // gotta tweak this bitch
            });
        });
    }

    //change = historicalSnapshots[0] ? data.stockData.AskRealtime - historicalSnapshots[0].AskRealtime : 0;
    if (change > 0) {
        // if I am currently holding stock
        // check to see if its price is now above the priceAtTimeOfPurchase
        // if so then sell a percentage
        for (var i in lots) {
            var lot = lots[i];
            if (lot.type == "buy") {
                if (data.stockData.AskRealtime > lot.priceAtTimeOfPurchase) {
                    process.nextTick(function() {
                        (function(data, lot) {
                            callback({
                                data: data,
                                action: "sell",
                                amount: lot.sharesOwned, // TODO: percentage based on angle of increase
                                lotToSell: lot
                            });
                        })(data, lot)
                    });
                }
            }
        }
    }

    // STOP LIMITS ARE FOR PUSSIES...

    // else if (change < 0) {
    //     for (var i in lots) {
    //         var lot = lots[i];
    //         if (lot.type == "buy") {
    //             // OH FUCK, TIME TO BAIL
    //             if (data.stockData.AskRealtime < lot.stopLimit) {
    //                 process.nextTick(function() {
    //                     callback({
    //                         data: data,
    //                         action: "sell",
    //                         amount: lot.sharesOwned, // sell all the shit
    //                         lotToSell: lot
    //                     });
    //                 });
    //             }
    //         }
    //     }
    // }

}

// When the day is over, sell off all remaining shares
module.exports.onComplete = function(data, callback) {
    console.log("HIGH:", high, "LOW:", low);
    var lots = data.lots;
    for (var i in lots) {
        var lot = lots[i];
        (function(lot, data) {
            callback({
                data: data,
                action: "sell",
                amount: lot.sharesOwned, // TODO: percentage based on angle of increase
                lotToSell: lot
            });
        })(lot, data);
    }

}
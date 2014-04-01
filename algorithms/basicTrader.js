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
var amount = 1024;
var action = "sell";
module.exports.onTimestep = function(data, callback) {
    var historicalSnapshots = [];

    // will attempt to load the last n previous snapshots so we can try to make educated decisions
    // if we are less than n timesteps from the start of the program, 
    // the results of queries with indices greater than the current timestep will be null
    for (var i = 1; i < 5; i++) {
        // Execute the loadPrevious command in sync so we can be sure it'll return in time for us to use it after the loop
        Sync(function() {
            var prev = data.loadPrevious.sync(null, i);
            historicalSnapshots.push(prev);
        });
    }

    // amount /= 2;
    // var lot;
    // if (action == "buy") {
    //     action = "sell";
    //     lot = data.lots[0];
    // } else if (action == "sell") {
    //     action = "buy";
    //     lot = null;
    // }

    action = (Math.random() < 0.5) ? "buy" : "sell";
    amount = Math.floor((Math.random() * 100) + 1);
    lot = data.lots[Math.floor(Math.random() * data.lots.length)] || {};
    callback({
        data: data,
        action: action,
        amount: amount,
        lotToSell: lot
    });
}
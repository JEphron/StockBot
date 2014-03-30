// This gets called for each symbol each timestep
// data is whatever's returned from the Yahoo Finance API
// call back with whatever action you want to perform in the format:
// {
//  dataSymbol: data.dataSymbol,
//  action: "buy" || "sell" || "short" || "none",
//  amount: 1000
// }
module.exports.onTimestep = function(data, callback) {
    var action = "none";
    var amount = 50;
    var historicalSnapshots = [];

    // will attempt to load the last n previous snapshots so we can try to make educated decisions
    // if we are less than n timesteps from the start of the program, 
    // the results of queries with indices greater than the current timestep will be null
    for (var i = 1; i < 5; i++) {
        Sync(function() {
            var prev = data.loadPrevious.sync(null, i);
            historicalSnapshots.push(prev);
        });
    }

    callback({
        dataSymbol: data.dataSymbol, // leave this as it is
        action: action,
        amount: amount
    });
}
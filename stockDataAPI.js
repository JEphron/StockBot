var request = require('request');

// Load the stock data from YAHOO's API
function getStockData(stocksToGet, callback) {
    // support passing a single symbol as a string instead of an array
    if (typeof stocksToGet === 'string') stocksToGet = [stocksToGet];
    // build the query string
    var s = 'q=select * from yahoo.finance.quotes where symbol in ("' + stocksToGet.join("\",\"") + '")';
    // build the url
    var url = 'http://query.yahooapis.com/v1/public/yql?' + encodeURI(s) + '&format=json&diagnostics=true&env=http://datatables.org/alltables.env';
    // make the request
    request.get(url, function(err, res, body) {
        if (err) return console.log(err);
        var data = JSON.parse(body);
        var results = data.query.results.quote;
        var stocks = {};

        if (stocksToGet.length === 1) {
            var symbolName = results.symbol;
            delete results.symbol;
            stocks[symbolName] = results;
        } else {
            for (var index in results) {
                var symbolName = results[index].symbol;
                delete results[index].symbol;
                stocks[symbolName] = results[index];
            }
        }

        process.nextTick(function() {
            callback(null, stocks);
        });
    });

};

module.exports.getStockData = getStockData;
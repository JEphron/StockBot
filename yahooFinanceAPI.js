// stockDataAPI.js
// Gets data about stocks and the market
// =====================================
// Functions
// =========
// getStockData() - gets a shitload of data from Yahoo's API

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
    console.log(url);
    request.get(url, function(err, res, body) {
        if (err) return console.log(err);
        try {
            var data = JSON.parse(body);
        } catch (e) {
            console.log(body);
            callback(e);
        }
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
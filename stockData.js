var request = require('request');

function getStockData(stocksToGet, callback) {

    var s = 'q=select * from yahoo.finance.quotes where symbol in ("' + stocksToGet.join("\",\"") + '")';
    var encoded = encodeURI(s);
    var url = 'http://query.yahooapis.com/v1/public/yql?' + encoded + '&format=json&diagnostics=true&env=http://datatables.org/alltables.env';

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
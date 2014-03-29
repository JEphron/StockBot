// stockBotEngine.js
// do the shit
var events = require('events'),
    stockDataAPI = require('./yahooFinanceAPI'),
    async = require('async');

function Engine(params, callback) {
    this.accounts = params.MWAccounts;
    this.orm = params.db;
    this.timestep = params.timestep;  
    this.masterAccount = params.MWAccounts[0];
    events.EventEmitter.call(this);
    var engine = this;
    async.series({
        one: engine.login.bind(this),
        two: engine.tick.bind(this),

    }, function() {
        process.nextTick(function() {
            callback();
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
}

Engine.prototype.timestepActionCallback = function(params) {
    var action = params.action;
    if (action == "none")
        return;
    switch (action) {
        case 'buy':
            async.each(this.accounts, function(account, next) {
                account.placeOrder(params.dataSymbol, params.amount, 'buy', next)
            })
            break;
        case 'sell':
            async.each(this.accounts, function(account, next) {
                account.placeOrder(params.dataSymbol, params.amount, 'sell', next)
            })
            break;
        case 'short':
            async.each(this.accounts, function(account, next) {
                account.placeOrder(params.dataSymbol, params.amount, 'short', next)
            })
            break;
        default:
            break;
    }
};

Engine.prototype.tick = function(callback) {
    var data = {};
    var engine = this;
    this.orm.db.TrackedStock.findAll().success(function(stocks) {
        var symbols = [];

        for (var i in stocks) symbols.push(stocks[i].symbol);


        // Ex: stock: YHOO, stockData:{...}, holdings: [{type:buy, shares:100}, {type:short, shares: 50}]
        stockDataAPI.getStockData(symbols, function(err, stockData) {

            engine.masterAccount.getHoldings(function(err, holdings) {

                for (var i in stockData) {
                    timestepdata = {};
                    timestepdata.stockData = stockData[i];
                    timestepdata.holdings = [];
                    for (var j in holdings) {
                        if (holdings[j].symbol == stockData[i].Symbol) {
                            timestepdata.holdings.push(holdings[j]);
                        }
                    }
                    if (timestepdata.holdings.length == 0)
                        timestepdata.holdings.push({
                            error: "No Holdings for " + stockData[i].Symbol
                        })
                    for (var j in stocks)
                        if (stocks[j].symbol == stockData[i].Symbol) timestepdata['MIC'] = stocks[j].exchange;
                    engine.emit('timestep', timestepdata, engine.timestepActionCallback.bind(engine));
                }
            })
        })
    })
    setTimeout(this.tick.bind(this), this.timestep);
    if (callback) callback();
}

module = module.exports = Engine;
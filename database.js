// database.js
// Handles all the database stuff

var Sequelize = require('sequelize'),
    async = require('async'),
    sequelize;

module.exports.sequelize = sequelize;
module.exports.Sequelize = Sequelize;
var db = {};
module.exports.db = db;
module.exports.init = function(params, callback) {

    if (params.URL) {
        var match = [];
        match = params.URL.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/)
        console.log(match);
        sequelize = new Sequelize(match[5], match[1], match[2], {
            dialect: "mysql",
            port: match[4],
            host: match[3],
            logging: params.log || false
        });
    } else {
        sequelize = new Sequelize('db', 'username', 'password', {
            dialect: "sqlite",
            storage: './db/database.sqlite',
            logging: params.log || false
        });
    }


    if (!callback) callback = function() {}
    // dis right here one ugly sumbitch 
    if (params.drop) {
        sequelize.drop().success(function() {
            doStuff();
        });
    } else {
        doStuff();
    }

    function doStuff() {

        // define bullshits
        db.TrackedStock = sequelize.define('TrackedStock', {
            symbol: Sequelize.STRING,
            exchange: Sequelize.STRING
        });

        db.Lot = sequelize.define('Lot', {
            sharesOwned: Sequelize.INTEGER,
            priceAtTimeOfPurchase: Sequelize.FLOAT,
            stopLimit: Sequelize.FLOAT,
            type: Sequelize.STRING
        });

        db.Snapshot = sequelize.define('Snapshot', {
            Ask: Sequelize.FLOAT,
            Bid: Sequelize.FLOAT,
            AskRealtime: Sequelize.FLOAT,
            BidRealtime: Sequelize.FLOAT,
            Change: Sequelize.FLOAT,
            ChangeRealtime: Sequelize.FLOAT,
            PercentChange: Sequelize.FLOAT,
            ChangeinPercent: Sequelize.FLOAT,
            LastTradePriceOnly: Sequelize.FLOAT

        });

        db.TrackedStock.hasMany(db.Snapshot);
        db.Snapshot.belongsTo(db.TrackedStock);
        db.TrackedStock.hasMany(db.Lot);
        db.Lot.belongsTo(db.TrackedStock);
        // sync
        sequelize.sync({
            force: params.drop
        }).success(function() {
            // create bullshits
            async.each(params.trackedstocks,
                function(stock, next) {
                    db.TrackedStock.findOrCreate({
                        symbol: stock.symbol,
                        exchange: stock.exchange
                    }).success(function(s) {
                        process.nextTick(function() {
                            next();
                        })
                    }).error(function(err) {
                        process.nextTick(function() {
                            next(err);
                        })
                    });
                }, function(err) {
                    if (err) return console.log(err);
                    process.nextTick(function() {
                        callback();
                    })
                });
        })
    }

}
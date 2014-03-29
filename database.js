// database.js
// Handles all the database stuff

var Sequelize = require('sequelize'),
    async = require('async'),
    sequelize = new Sequelize('db', 'username', 'password', {
        dialect: "sqlite",
        storage: './db/database.sqlite'
    });

module.exports.sequelize = sequelize;
module.exports.Sequelize = Sequelize;
var db = {};
module.exports.db = db;
module.exports.init = function(params, callback) {

    if (!callback) callback = function() {}
    // dis right here one ugly sumbitch 
    sequelize.drop().success(function() {
        // define bullshits
        db.TrackedStock = sequelize.define('TrackedStock', {
            symbol: Sequelize.STRING,
            exchange: Sequelize.STRING
        });

        db.Lot = sequelize.define('Lot', {
            sharesOwned: Sequelize.INTEGER,
            priceAtTimeOfPurchase: Sequelize.FLOAT,
            stopLimit: Sequelize.FLOAT
        });

        // sync
        sequelize.sync({
            force: true
        }).success(function() {
            // create bullshits
            async.each(params.trackedstocks,
                function(stock, next) {
                    db.TrackedStock.create({
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
                    console.log("MEEEEEP");
                    process.nextTick(function() {
                        callback();
                    })
                });
        })
    });

}
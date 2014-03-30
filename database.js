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

    sequelize = new Sequelize(params.db || 'db', params.username || 'username', params.password || 'password', {
        dialect: params.dialect || "sqlite",
        storage: params.storage || './db/database.sqlite',
        logging: params.log || false
    });

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
            stopLimit: Sequelize.FLOAT,
            type: Sequelize.STRING
        });

        db.Snapshot = sequelize.define('Snapshot', {
            Ask: Sequelize.FLOAT,
            Bid: Sequelize.FLOAT,
            AskRealTime: Sequelize.FLOAT,
            BidRealTime: Sequelize.FLOAT,
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
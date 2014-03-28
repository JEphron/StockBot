// Module: database.js
var Sequelize = require('sequelize'),
    sequelize = new Sequelize('db', 'username', 'password', {
        dialect: "sqlite"
    });

var Symbol = sequelize.define('Symbol', {
    symbol: Sequelize.STRING,
    exchange: Sequelize.STRING
});

var Lot = sequelize.define('Lot', {
    sharesOwned: Sequelize.INTEGER,
    priceAtTimeOfPurchase: Sequelize.FLOAT,
    stopLimit: Sequelize.FLOAT
});

sequelize.sync();
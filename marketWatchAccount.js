// marketWatchAccount.js
// Provides a way to send/receive information from marketwatch.com
// ===============================================================
// Functions
// =========
// login() - logs the client into the server
// placeOrder() - places an order (buy/sell/short/etc) with the server
// getOrders() - gets the currently open orders
// getHoldings() - gets the current holdings
// getStats() - gets player stats

var cheerio = require('cheerio'),
    async = require('async'),
    Request = require('request');

var API = function(creds) {
    this.db = creds.db;
    delete creds.db;
    this.credentials = creds;
    this.request = Request.defaults({
        jar: Request.jar() // create new cookie jar for this instance of request
    });


}

API.prototype.credentials = {};

// Login to the server
API.prototype.login = function(callback) {
    console.log(this.credentials)
    var opts = {
        url: 'https://id.marketwatch.com/auth/submitlogin.json',
        headers: {
            'Host': 'id.marketwatch.com',
            'Origin': 'https://id.marketwatch.com',
            'Pragma': 'no-cache',
            'Referer': 'https://id.marketwatch.com/access/50eb2d087826a77e5d000001/latest/login_standalone.html',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/33.0.1750.152 Safari/537.36',
            'X-Requested-With': 'XMLHttpRequest',
            'Cache-Control': 'no-cache'
        },
        json: {
            password: this.credentials.password,
            username: this.credentials.email,
            realm: 'default',
            savelogin: 'true',
            template: 'default',
            url: 'https://id.marketwatch.com/access/50eb2d087826a77e5d000001/latest/login_reload.html'
        }
    };

    this.request.post(opts, function(err, res, body) {
        if (err) return console.log(err);
        console.log("Login:", body);
        // server replies with a url to get auth cookies from
        this.request.get(body.url, function(err, res, body) {
            if (err) return console.log(err);
            process.nextTick(function() {
                callback();
            });
        });
    });

};

// Submit an order to the server
API.prototype.placeOrder = function(dataSymbol, shares, orderType, callback) {
    var opts = {
        url: 'http://www.marketwatch.com/game/' + this.credentials.gameName + '/trade/submitorder',
        headers: {
            'Host': 'www.marketwatch.com',
            'Origin': 'http://www.marketwatch.com',
            'Pragma': 'no-cache',
            'Referer': 'http://www.marketwatch.com/game/' + this.credentials.gameName + '/trade',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/33.0.1750.152 Safari/537.36',
            'X-Requested-With': 'XMLHttpRequest',
            'Connection': 'keep-alive',
            'Cache-Control': 'no-cache',
        },
        json: [{
            Fuid: dataSymbol,
            Shares: shares.toString(),
            Type: orderType.charAt(0).toUpperCase() + orderType.slice(1)
        }]
    };

    this.request.post(opts, function(err, res, body) {
        if (err) return console.log(err);
        if (body.succeeded) {
            console.log("SUCCESS!", dataSymbol, orderType, shares, body.message);
        } else {
            console.log("REJECTION:", body.message)
        }
        process.nextTick(function() {
            callback();
        });
    });
};

// Get the portfolio page and parse the orders table
// Return a list of orders
API.prototype.getOrders = function(callback) {
    this.request.get('http://www.marketwatch.com/game/' + this.credentials.gameName + '/portfolio/orders', function(err, res, body) {
        // parse the HTML of the page
        var $ = cheerio.load(body);
        var orders = [];
        // for each row in the body of the table in the portfolio section
        $("section.portfolio > table > tbody tr").each(function(i, el) {
            // get each cell in the row
            var tds = $(el).find('td');
            // hopefully they won't change their format any time soon. 
            orders[i] = {
                stockName: $(tds[0]).text().replace(/\t|\n|\r/g, ''), // jeez, these guys have some real messed up html
                count: $(tds[1]).text().replace(/\t|\n|\r/g, ''),
                type: $(tds[2]).text().replace(/\t|\n|\r/g, ''),
                activationDate: $(tds[3]).text().replace(/\t|\n|\r/g, '')
            };
        });
        process.nextTick(function() {
            callback(null, orders);
        })
    });
}

// Gets the players holdings as an array
API.prototype.getHoldings = function(callback) {
    // get the holding's partial
    this.request.get('http://www.marketwatch.com/game/' + this.credentials.gameName + '/portfolio/Holdings?view=list&partial=true', function(err, res, body) {
        if (err) return console.log(err);
        var $ = cheerio.load(body);
        var holdings = [];

        // each tr is a seperate holding
        $("tbody > tr").each(function(i, el) {
            var tds = $(el).find('td');
            holdings.push({
                symbol: $(tds[0]).text().trim(),
                last: $(tds[1]).text().trim(),
                overallChange: $(tds[2]).text().trim(),
                marketValue: $(tds[3]).text().trim(),
                gainLoss: $(tds[4]).text().trim(),
                dataSymbol: $(el).attr('data-symbol'),
                type: $(el).attr('data-type'),
                shares: $(el).attr('data-shares'),
                pending: $(el).attr('data-pending')
            });

        });
        process.nextTick(function() {
            callback(null, holdings);
        })
    });
}

// Get the stats:
// Ex:
// { 'Net Worth': '$100,000.00',
//   'Overall Gains': '$0.00',
//   'Overall Returns': '0.00%',
//   'Today\'s Gains': '0.00%',
//   'Buying Power': '$180,048.00',
//   'Cash Remaining': '$100,000.00',
//   'Cash Borrowed': '$0.00',
//   'Short Reserve': '$0.00' }

API.prototype.getStats = function(callback) {
    this.request.get('http://www.marketwatch.com/game/' + this.credentials.gameName + '/portfolio/orders', function(err, res, body) {
        var $ = cheerio.load(body);
        var stats = {};
        // get each li that is the direct child of the ul with the class performance in the section with the class playerdetail
        $("section.playerdetail  ul.performance > li").each(function(i, el) {
            // use label text as the key and the data as the value
            stats[$(el).find('.label').text()] = $(el).find('.data').text();
        });

        $("section.playerdetail  ul.worth > li").each(function(i, el) {
            stats[$(el).find('.label').text()] = $(el).find('.data').text();
        });
        process.nextTick(function() {
            callback(null, stats);
        })
    });
}

API.prototype.getTransactions = function(callback) {
    this.request.get('http://www.marketwatch.com/game/' + this.credentials.gameName + '/portfolio/transactionhistory?view=list&partial=true', function(err, res, body) {
        var $ = cheerio.load(body);
        var transactions = {};

        $("tbody > tr").each(function(i, el) {
            var tds = $(el).find('td');
            transactions.push({
                symbol: tds[0],
                orderData: tds[1],
                transactionData: tds[2],
                type: tds[3],
                shares: tds[4],
                priceAtExecution: tds[5]
            });
        });

        process.nextTick(function() {
            callback(null, transactions);
        })
    });
}


exports = module.exports = API;
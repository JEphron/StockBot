var cheerio = require('cheerio'),
    request = require('request').defaults({
        jar: true // enable cookies in request
    });

var credentials = {};

function init(creds) {
    credentials = creds;
}

// Login to the server
function login(callback) {
    console.log(credentials)
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
            password: credentials.password,
            username: credentials.email,
            realm: 'default',
            savelogin: 'true',
            template: 'default',
            url: 'https://id.marketwatch.com/access/50eb2d087826a77e5d000001/latest/login_reload.html'
        }
    };

    request.post(opts, function(err, res, body) {
        if (err) return console.log(err);
        console.log("Login:", body);

        // server replies with a url to get auth cookies from
        request.get(body.url, function(err, res, body) {
            if (err) return console.log(err);
            console.log("Got post-login auth page:", body);
            process.nextTick(function() {
                callback();
            });
        });
    });
};

// Submit an order to the server
function placeOrder(stockID, shares, orderType, callback) {
    var opts = {
        url: 'http://www.marketwatch.com/game/' + credentials.gameName + '/trade/submitorder?week=1', // DANGER DANGER WHAT IS THIS EVEN?
        headers: {
            'Host': 'www.marketwatch.com',
            'Origin': 'http://www.marketwatch.com',
            'Pragma': 'no-cache',
            'Referer': 'http://www.marketwatch.com/game/' + credentials.gameName + '/trade',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/33.0.1750.152 Safari/537.36',
            'X-Requested-With': 'XMLHttpRequest',
            'Connection': 'keep-alive',
            'Cache-Control': 'no-cache',
        },
        json: [{
            Fuid: stockID,
            Shares: shares.toString(),
            Type: orderType
        }]
    };

    request.post(opts, function(err, res, body) {
        if (err) return console.log(err);
        if (body.succeeded) {
            console.log("SUCCESS!", body.message);
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
function loadOrders(callback) {
    request.get('http://www.marketwatch.com/game/' + credentials.gameName + '/portfolio/orders', function(err, res, body) {
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
        console.log(orders);
        process.nextTick(function() {
            callback(null, orders);
        })
    });
}

function loadStats(callback) {
    request.get('http://www.marketwatch.com/game/' + credentials.gameName + '/portfolio/orders', function(err, res, body) {
        var $ = cheerio.load(body);
        var stats = {};
        $("section.playerdetail  ul.performance > li").each(function(i, el) {
            console.log($(el).find('.label').text());
            stats[$(el).find('.label').text()] = $(el).find('.data').text();
        });

        $("section.playerdetail  ul.worth > li").each(function(i, el) {
            stats[$(el).find('.label').text()] = $(el).find('.data').text();
        });
    console.log(stats);
});
}


module.exports.init = init;
module.exports.login = login;
module.exports.placeOrder = placeOrder;
module.exports.loadOrders = loadOrders;
module.exports.loadStats = loadStats;
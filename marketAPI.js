var request = require('request').defaults({
    jar: true // enable cookies in request
});

// Login to the server
function login(creds, callback) {
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
            password: creds.password,
            username: creds.email,
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
        url: 'http://www.marketwatch.com/game/testpleaseignore/trade/submitorder?week=1',
        headers: {
            'Host': 'www.marketwatch.com',
            'Origin': 'http://www.marketwatch.com',
            'Pragma': 'no-cache',
            'Referer': 'http://www.marketwatch.com/game/testpleaseignore/trade',
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

module.exports.login = login;
module.exports.placeOrder = placeOrder;
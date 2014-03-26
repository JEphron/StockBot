var http = require('http');
var async = require('async');
var request = require('request').defaults({
    jar: true
});


var login = function(cb) {
    var opts = {
        url: "https://id.marketwatch.com/auth/submitlogin.json",
        headers: {
            'Cookie': 'kayla=g=297abf5b73bd4286ac02e42b53cd9426; mw5_loc={"Country":"US","Region":"NY","City":"NEWYORK","Continent":"NA","County":["NEWYORK"]}; s_vnum=1398459685229%26vn%3D1; djcs_route=e66ceff7-0008-4f78-9bfa-899062a7b19a; JSESSIONID=1020BA4023E7458DA70C032E3D1DA26D.prod5; ASP.NET_SessionId=reb2lyj3gr2djrf4aznodbiy; gpv_pn=subscriptions%2Fdefault.aspx; TR=V1-NGI0ZTg1YzktYmUzNy00NjE0LTgzZWQtYTZhNzIxNTZjMGVh; utag_main=_st:1395870207094$ses_id:1395868751742%3Bexp-session; s_invisit=true; tport={"Positions":[],"GracePeriodUri":""}; s_cc=true; s_sq=djglobal%2Cdjmarketwatch%3D%2526pid%253DMW_login_standalone_standalone%2526pidt%253D1%2526oid%253DLog%252520In%2526oidt%253D3%2526ot%253DSUBMIT',
            'Host': 'id.marketwatch.com',
            'Origin': 'https://id.marketwatch.com',
            'Pragma': 'no-cache',
            'Referer': 'https://id.marketwatch.com/access/50eb2d087826a77e5d000001/latest/login_standalone.html',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/33.0.1750.152 Safari/537.36',
            'X-HTTP-Method-Override': 'POST',
            'X-Requested-With': 'XMLHttpRequest',
            'Cache-Control': 'no-cache'
        },
        json: {
            password: "immabot",
            realm: "default",
            savelogin: "true",
            template: "default",
            url: "https://id.marketwatch.com/access/50eb2d087826a77e5d000001/latest/login_reload.html",
            username: "a405312@drdrb.net",
        }
    };

    request.post(opts, function(err, res, body) {
        if (err) return console.log(err);
        console.log("Attempted login: ", body);
        process.nextTick(function() {
            cb();
        });
    });
};

var submitTrade = function(cb) {
    var opts = {
        url: 'http://www.marketwatch.com/game/testpleaseignore/trade/submitorder?week=1',
        headers: {
            'Host': 'www.marketwatch.com',
            'Connection': 'keep-alive',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'Origin': 'http://www.marketwatch.com',
            'X-Requested-With': 'XMLHttpRequest',
            'Content-Type': 'application/json',
            'Accept': 'application/json, text/javascript, */*; q=0.01',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/33.0.1750.152 Safari/537.36',
            'Referer': 'http://www.marketwatch.com/game/testpleaseignore/trade',
            'Accept-Encoding': 'gzip,deflate,sdch',
            'Accept-Language': 'en-US,en;q=0.8',
            'Cookie': 'kayla=g=297abf5b73bd4286ac02e42b53cd9426; mw5_loc={"Country":"US","Region":"NY","City":"NEWYORK","Continent":"NA","County":["NEWYORK"]}; s_vnum=1398459685229%26vn%3D1; djcs_route=e66ceff7-0008-4f78-9bfa-899062a7b19a; _cb_ls=1; __g_u=313710166672648_1_0.01_0_5_1396300448511; mw5_prefs=mox=False&tth=False&exp=3/26/2016; __g_c=w%3A1%7Cb%3A6%7Cc%3A313710166672648%7Cd%3A1%7Ca%3A0%7Ce%3A0.01%7Cf%3A0; gpv_pn=MW_Home; refresh=off; user_type=subscribed; TR=V1-NGI0ZTg1YzktYmUzNy00NjE0LTgzZWQtYTZhNzIxNTZjMGVh; REMOTE_USER=4b4e85c9-be37-4614-83ed-a6a72156c0ea; djcs_auto=M1395867824%2FXNNB6hD%2BZk3vRmKTxr2jypHrXEyfHbXI0AwVjPeZGPra1kM12d2lpqB975hlaAHy0pQcPBWRbPLzi%2BclORlH6tS1d5fPbufknbuYLzWrneAxBq%2BTmyGgPtB2XLfyCWO9uQRqDivwXHlEhVyPkU%2BbMY0pVSdnXu4P7kaPuzh6o5DwxP3grjyP21UiXd6I3FTjQAGq6v7%2BjGzJYpSdlMZSaA%3D%3DG; djcs_session=M1395866628%2FQnAiWrBl7jqVspeb1Jb7mIrho77qtr6RL3p%2BK4EN7qla57PoBpRqg6t4YwJ4azxuw4QX9LTIPhvnMaJRbiIjEadD1snRZEbPRwaHprWPkkaYoENwEP7jQ%2BqMEvFOsxdjV4bkK0PYrJmCQbbflhCrspxuuApWgsGi7Pfm75S3K0Kg4unIr9xemWKRK7qvNBUhIPkHr41sVP9MTIuyFp7T5%2F3SMEzWfTFLufbWVK6nEI2tL%2BUaxAfSz6qW329js9aCyCSCXOAyRnm22YW3RhEgI1C%2BKt2ygM%2B6mBib6l5%2FU1LdLM0gdLbMjb2kEdVFdIXqL6ijkhqvcU%2Bjr4tb4sasetXinjdK%2F6xtTwryvcZnURu0TFnUluqJ1PC4YpjdcPgHzPVdo2KTMhRFk3vXdhArRYipzRyHSAVpXyeXEno3Rt8%3DG; djcs_perm=M1395867824%2FhlenCMN6cM5zj1ollk8xT4lv0vttJ5bGf3yllyONQGOq3G8D8VcrMY3MO5liezj8z7vnbqnHlgkrO8%2BUc3lQpcMUXU3nh2bX6FzaPpcDAnBVyYvNWsXwPU9vO9ARzWQh%2BBDKa18xHjYJbz52wtym0gT9l5BCt5uDeMn1EMOBKICkWwWbaO4oCTGaTYCX%2BUiflMX9oJyb1nO%2FzCFDEvexpulvimkX97gvyvtueXXPlDVYkcSceKvhNkZJlMbKRkWIc4%2FlBxKJPjVJOmls1y4eFQ%3D%3DG; wsjlocal=VjE6bmFkcm9qakBtYWMuY29tOjQsNzMsMjgxLDMwMSwxMTYx; djcs_info=eycjdmVyJzonMScsJ2xhc3RfbmFtZSc6J0VwaHJvbicsJ3Nlc3Npb24nOidkZWJlMWFiMi1mNzUwLTQ2N2EtYjdmYi02MGE3YTk1ZmM0NjEnLCdyb2xlcyc6J1dTSi1DSEFOR0VQQVNTV09SRCUyQ0JBUlJPTlMtQ0hBTkdFUEFTU1dPUkQlMkNXU0otQVJDSElWRSUyQ0ZSRUVSRUctQkFTRSUyQ1dTSi1TRUxGU0VSVicsJ3V1aWQnOic0YjRlODVjOS1iZTM3LTQ2MTQtODNlZC1hNmE3MjE1NmMwZWEnLCdlbWFpbCc6J25hZHJvamolNDBtYWMuY29tJywnZmlyc3RfbmFtZSc6J0pvcmRhbicsJ3VzZXInOiduYWRyb2pqJTQwbWFjLmNvbSd9; .ASPXAUTH=AEB90E3140B6034AF0C328673474C658B3E968A8973C6E890977D02F5931CE5570FE0C31693B492048935A5A133F4DB2D1BDE83276ABC2CCB213EFFC54C0B8EE38CAD09FEF83271889FA96EDB08EF1444311F7C5B8CFC5CE8FB172C3BCFCBCDFADE49EEB63805E7F51545D19F1D99AB4EC048FB5686418929D6AC20426471506CE22FD0F590474B6274C77DB09F75425515AA11B1EE2407A7C318FF91BBAE02B91E0B4F28BA9BF47F5C95BB050721E0AF709D6101D3275C9121701DB1064CF6C996B6FA20127366A376DED56296441AC47182409C39792D7D1D8ECECEDE3117D7E46ABD662EBF73EC79BCC76B712853A8B68AEFAF8D09FF7B1AD8E52E093E686E9A9B7B4548A8A54B0B105F91F295972BCDA93E9B03AC038B4D21CE3F5E50565FEFECF35C94BA2CE6442110EE98A5BBEFB4B6592F16FB7331DE3776F5C5740796FC46CB7AF1149110573BE979FB1011191A90A60DB15386F6E9B7E26F4724FAFAFC404A6AD815312BC1C40EF036057A85664FB9C6E264914F9C525DFFC9AAB9E08BD9F5CAA3ABA3531241E25A6CFBFF1ED6676E61DEA55056F5A5D7095036B06CBEFB60875E2B4D36745AB3C64F66A9356F82959FB0318E8EFF38D7FE2B7C97E5736893B8A54CBE549F3640DA68EC8E4CEC4EF9D509B52E3E891D16B572E207337BFC6A0AF54454845ECF0EF99F58E4C; tport={"Positions":[],"GracePeriodUri":""}; utag_main=_st:1395871629506$ses_id:1395868751742%3Bexp-session; _chartbeat2=elki618co2axl5nz.1395868277506.1395869830128.1; _chartbeat_uuniq=2; ASP.NET_SessionId=bzm5bz5gvpec2v2axuomstg0; s_cc=true; s_invisit=true; s_sq=djglobal%2Cdjmarketwatch%3D%2526pid%253DMW_Games_Trade%2526pidt%253D1%2526oid%253DSUBMIT%252520TRADES%2526oidt%253D3%2526ot%253DSUBMIT'
        },
        json: [{
            Fuid: "STOCK-XNAS-ZNGA",
            Shares: "1000",
            Type: "Buy"
        }]
    };

    request.post(opts, function(err, res, body) {
        process.nextTick(function() {
            if (err) return console.log(err);
            console.log("Res:", res);
            console.log("Attempted trade:", body);
            cb();
        });
    });

}
async.series([

    function(cb) {
        login(cb);
    },
    function(cb) {
        submitTrade(cb);
    }
]);
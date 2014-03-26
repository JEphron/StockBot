var http = require('http');
var request = require('request');

var opts = {
	url: "https://id.marketwatch.com/auth/submitlogin.json",
	headers: {
		'Cookie': 'kayla=g=297abf5b73bd4286ac02e42b53cd9426; mw5_loc={"Country":"US","Region":"NY","City":"NEWYORK","Continent":"NA","County":["NEWYORK"]}; s_vnum=1398459685229%26vn%3D1; djcs_route=e66ceff7-0008-4f78-9bfa-899062a7b19a; JSESSIONID=1020BA4023E7458DA70C032E3D1DA26D.prod5; ASP.NET_SessionId=reb2lyj3gr2djrf4aznodbiy; gpv_pn=subscriptions%2Fdefault.aspx; TR=V1-NGI0ZTg1YzktYmUzNy00NjE0LTgzZWQtYTZhNzIxNTZjMGVh; utag_main=_st:1395870207094$ses_id:1395868751742%3Bexp-session; s_invisit=true; tport={"Positions":[],"GracePeriodUri":""}; s_cc=true; s_sq=djglobal%2Cdjmarketwatch%3D%2526pid%253DMW_login_standalone_standalone%2526pidt%253D1%2526oid%253DLog%252520In%2526oidt%253D3%2526ot%253DSUBMIT',
		'Host':'id.marketwatch.com',
		'Origin':'https://id.marketwatch.com',
		'Pragma':'no-cache',
		'Referer':'https://id.marketwatch.com/access/50eb2d087826a77e5d000001/latest/login_standalone.html',
		'User-Agent':'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/33.0.1750.152 Safari/537.36',
		'X-HTTP-Method-Override':'POST',
		'X-Requested-With':'XMLHttpRequest',
		'Cache-Control':'no-cache'
	},
	json: {
		password: "immabot",
		realm: "default",
		savelogin: "true",
		template: "default",
		url: "https://id.marketwatch.com/access/50eb2d087826a77e5d000001/latest/login_reload.html",
		username: "a405312@drdrb.net",
	}
}

request.post(opts, function(err, res, body){
	console.log(body);
});

console.log('Server running at http://127.0.0.1:1337/');

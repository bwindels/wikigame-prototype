var express = require('express');
var app = express();
var http = require('http');
var fs = require('fs');

app.get('/play', function(req, res) {
	res.set('Content-Type', 'text/html');
	res.send(fs.readFileSync(__dirname + '/play.html'));
});

app.get('/wikipedia.css', function(req, res) {
	res.set('Content-Type', 'text/css');
	res.send(fs.readFileSync(__dirname + '/wikipedia.css'));
});

app.get('/play.js', function(req, res) {
	res.set('Content-Type', 'text/javascript');
	res.send(fs.readFileSync(__dirname + '/play.js'));
});

app.use(app.router);
//if request was not caught by router, act as proxy to wikipedia
app.use(function(req, res) {
	var options = {
		hostname: 'en.wikipedia.org',
		port: 80,
		path: req.path,
		method: 'GET'
	};

	var wikiReq = http.request(options, function(wikiRes) {
		Object.keys(wikiRes.headers).forEach(function(headerName) {
			res.set(headerName, wikiRes.headers[headerName]);
		});

		wikiRes.on('data', function (chunk) {
			res.write(chunk);
		});

		wikiRes.on('end', function() {
			res.end();
		});

	});

	wikiReq.on('error', function(e) {
		console.log(e);
		res.send(500);
	});

	wikiReq.end();
});

app.listen(2000);
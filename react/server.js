// server.js
var port = process.env.PORT || 8080;

// require packages
var express    = require("express");
var app        = express();
var bodyParser = require("body-parser");

var httpProxy = require('http-proxy');
var apiProxy = httpProxy.createProxyServer();
var cgiServer = 'http://localhost';

/* 
app.all("/perfsonar-graphs/*", function(req, res) {
    console.log('redirecting to port 80');
    apiProxy.web(req, res, {target: cgiServer});
});

app.all("/esmond/*", function(req, res) {
    console.log('redirecting to port 80');
    apiProxy.web(req, res, {target: cgiServer});
});
*/

// middleware
app.use("/public", express.static(__dirname + "/public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// routing
app.get('/', function(req, res) {
    res.sendFile("index.html", {root: "public"});
});

// start
app.listen(port);

console.log('Server started on port ' + port);

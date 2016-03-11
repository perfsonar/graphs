// server.js
var port = process.env.PORT || 8080;

// require packages
var express    = require("express");
var app        = express();
var bodyParser = require("body-parser");

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

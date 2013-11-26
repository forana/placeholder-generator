var express = require("express");
var builder = require("./builder");

var port = process.env.PORT || 8080;

var app = express();

var assets = express.static(__dirname + "/assets");

app.use("/assets", assets);

app.get("/", function(req, res, next) {
	res.sendfile("assets/index.html");
});

app.get(/^\/([0-9]+)x([0-9]+)(x[0-9]+)?(:[0-9]+)?/, function(req, res) {
	var width = req.params[0];
	var height = req.params[1];
	var sites = req.params[2] ? req.params[2].substring(1) : 25;
	var border = req.params[3] ? req.params[3].substring(1) : 2;

	if (sites > 500 || width > 200000 || height > 200000) {
		res.send("too big, cannot deal", 500);
	} else if (sites < 2 || width < 1 || height < 1) {
		res.send("something's too small", 500);
	} else {
		var xml = builder.generateVoronoiSVG(width, height, sites, border);

		res.setHeader("Content-Type", "image/svg+xml");
		res.setHeader("Content-Length", xml.length);
		res.end(xml);
	}
});

app.listen(port);
console.log("Running on port", port);

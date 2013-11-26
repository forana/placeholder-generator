var Voronoi = require("./rhill-voronoi-core").Voronoi;
var _ = require("underscore");
var xmlbuilder = require("xmlbuilder");

function pair(point) {
	return point.x+","+point.y + " ";
}

function eq(p1, p2) {
	return Math.round(p1.x * 100) == Math.round(p2.x * 100) && Math.round(p1.y * 100) == Math.round(p2.y * 100);
}

// takes a not-necessarily-ordered-properly set of points and constructs an ordered set of points
// that represent the perimeter
function reconcileLines(olines) {
	var lines = _.clone(olines);

	// sometimes, we don't get a full closed path (usually seems to be around the border)
	// check for non-closed path by finding points that aren't repeated
	var hits = [];
	var flip = false;
	var stats = [];
	lines.forEach(function (line) {
		stats.push(pair(line[0]));
		stats.push(pair(line[1]));
	});
	for (var i = 0; i<stats.length; i++) {
		if (stats.indexOf(stats[i]) == stats.lastIndexOf(stats[i])) {
			hits.push([Math.floor(i/2), i % 2])
		}
	}
	// if we found hits, they should be a pair - those are the unmatched points
	if (hits.length > 0) {
		if (hits.length != 2) {
			console.log("Hits: ", hits);
			throw "Found a mismatch, but unable to correct it";
		}

		// I'm sorry about this
		var p1 = lines[hits[0][0]][hits[0][1]];
		var p2 = lines[hits[1][0]][hits[1][1]];
		
		lines.push([p1, p2]);
	}
	// end non-closed path detection

	// build by starting with the first, and just trying to match point-by-point
	var points = [];
	points.unshift(lines[0][0]);
	points.unshift(lines[0][1]);
	lines.splice(0, 1);
	while (lines.length > 0) {
		for (var i = 0; i < lines.length; i++) {
			if (eq(lines[i][0], lines[i][1])) {
				lines.splice(i, 1);
				break;
			} else if (eq(points[0], lines[i][0])) {
				points.unshift(lines[i][1]);
				lines.splice(i, 1);
				break;
			} else if (eq(points[0], lines[i][1])) {
				points.unshift(lines[i][0]);
				lines.splice(i, 1);
				break;
			} else if (i == lines.length - 1) {
				throw "Unable to close points";
			}
		}
	}
	return points;
}

// convert a set of ordered points into the SVG path string to draw them
function buildPath(points) {
	var s = "M ";
	s += pair(points[0]);
	s += "L ";
	for (var i = 1; i<points.length; i++) {
		s += pair(points[i]);
	}
	s + "Z";
	return s;
}

function randomRGB() {
	return "rgb(" +
		Math.floor(Math.random() * 256) + "," +
		Math.floor(Math.random() * 256) + "," +
		Math.floor(Math.random() * 256) + ")";
}

function generateVoronoiSVG(width, height, siteCount, border) {
	var v = new Voronoi();

	var bbox = {xl:0, xr: width, yt: 0, yb: height};

	var sites = [];
	for (var i=0; i<siteCount; i++) {
		sites.push({x: Math.random() * width, y: Math.random() * height});
	}

	var cells = v.compute(sites, bbox).cells;

	var xml = xmlbuilder.create("svg");
	xml
		.att("xmlns", "http://www.w3.org/2000/svg")
		.att("version", "1.1");

	cells.forEach(function (cell) {
		var path = xml.ele("path")
			.att("stroke", "black")
			.att("stroke-width", border)
			.att("fill", randomRGB());
		var lines = [];
		cell.halfedges.forEach(function(edge) {
			lines.push([edge.edge.va, edge.edge.vb])
		});
		var points = reconcileLines(lines);
		path.att("d", buildPath(points));
	});

	return xml.toString();
};

module.exports.generateVoronoiSVG = generateVoronoiSVG;

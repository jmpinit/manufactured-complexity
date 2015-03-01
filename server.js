var express    = require('express');
var app        = express();

console.log(__dirname + '/www');
app.use(express.static(__dirname + '/www/'));
app.use(express.logger('dev'));

app.config = require("./config");

function start() {
	app.listen(app.config.port);
	console.log("server pid %s listening on port %s in %s mode",
		process.pid,
		app.config.port,
		app.get('env')
	);
}

// only start server if this script is executed, not if it's require()'d.
if (require.main === module) {
	start();
}

exports.app = app;

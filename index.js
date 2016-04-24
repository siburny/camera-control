var express = require('express');
var serveIndex = require('serve-index');
var contentDisposition = require('content-disposition');
var mustacheExpress = require('mustache-express');
var camera = require('./camera');

var app = express();
app.engine('mhtml', mustacheExpress());
app.set('view engine', 'mhtml');
app.set('view cache', false);
app.set('views', __dirname + '/views');

app.get('/', function (req, res) {
	camera.list(function (list) {
		res.render('index', { list: list });
	});
});

app.get('/capture', function (req, res) {
  res.render('capture');
});

app.get('/api/shoot', function (req, res) {
	camera.shoot(function (capture) {
		if (capture.hasOwnProperty('filename'))
			res.json({ success: true, filename: capture.filename, path: "/output/" + capture.filename });
		else
			res.json({ success: false });
	});
});

app.get('/api/preview', function (req, res) {
	camera.preview(function (capture) {
		res.json({ success: true });
	});
});

app.get('/api/zoom', function (req, res) {
	camera.zoom(req.query.step, function (capture) {
		res.json({ success: true });
	});
});

app.get('/api/start_interval', function (req, res) {
	camera.start_interval();
	res.json({ success: true });
});

app.get('/api/stop_interval', function (req, res) {
	camera.stop_interval();
	res.json({ success: true });
});

app.get('/api/get_config', function (req, res) {
	if (!req.query.name) {
		res.json({ success: false, error: "No config name is provided." });
	} else {
		camera.get_config(req.query.name, function (value, options) {
			if (value && options) {
				res.json({ success: true, value: value, options: options });
			} else {
				res.json({ success: false });
			}
		});
	}
});

app.get('/api/set_config', function (req, res) {
	if (!req.query.name) {
		res.json({ success: false, error: "No config name is provided." });
	} else if (!req.query.value) {
		res.json({ success: false, error: "No config value is provided." });
	} else {
		camera.set_config(req.query.name, req.query.value, function (value, options) {
			if (value && options) {
				res.json({ success: true, value: value, options: options });
			} else {
				res.json({ success: false });
			}
		});
	}
});

app.use('/', express.static('static'));

app.use('/output', serveIndex('output', { 'icons': true }));
app.use('/output', express.static('output', {
  'index': false,
  'setHeaders': setHeaders
}));
function setHeaders(res, path) {
  res.setHeader('Content-Disposition', contentDisposition(path))
}

app.listen(3000, function () {
  console.log('Camera Control app is listening on port 3000 ...');
});



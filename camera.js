var os = require("os");
var exec = require('child_process').exec;
require('date-util');
var sem = require('semaphore')(1);

function camera() { }

camera.list = function (callback) {
	sem.take(function () {
		exec("gphoto2 --auto-detect",
			function (error, stdout, stderr) {
				sem.leave();

				if (error !== null) {
					console.log('error: ' + error);
				} else {
					lines = stdout.split(os.EOL);

					lines.splice(0, 2);

					lines = lines.filter(function (item) { return item != undefined && item.trim() != "" });

					for (i = 0; i < lines.length; i++)
						lines[i] = lines[i].substr(0, 31).trim();

					if (!!callback)
						callback(lines);
				}
			}
		);
	});
}

camera.shoot = function (callback) {
	sem.take(function () {
		var filename = new Date().format("yyyymmdd-HHMMssl");
		exec("gphoto2 --set-config 5004=6 --capture-image-and-download --filename 'output/" + filename + ".%C'",
			function (error, stdout, stderr) {
				sem.leave();

				if (error !== null) {
					console.log('exec error: ' + error);
					if (!!callback)
						callback({ 'error': true });
				} else {
					if (!!callback)
						callback({ 'filename': filename });
				}
			}
		);
	});
}

camera.preview = function (callback) {
	sem.take(function () {
		var filename = new Date().format("yyyymmdd-HHMMssl");
		exec("gphoto2 --set-config 5004=0 --set-config controlmode=1 --set-config focusmode2=4 --capture-image-and-download --force-overwrite --filename 'output/preview.jpg'",
			function (error, stdout, stderr) {
				sem.leave();

				if (error !== null) {
					console.log('exec error: ' + error);
					if (!!callback)
						callback({ 'error': true });
				} else {
					if (!!callback)
						callback({ success: true });
				}
			}
		);
	});
}

camera.zoom = function (step, callback) {
	sem.take(function () {
		var filename = new Date().format("yyyymmdd-HHMMssl");
		exec("gphoto2 --set-config 5004=0 --set-config controlmode=1 --set-config focusmode2=4 --capture-preview --set-config manualfocusdrive=" + step + " --force-overwrite --capture-image-and-download --force-overwrite --filename 'output/preview.jpg'",
			function (error, stdout, stderr) {
				sem.leave();

				if (error !== null) {
					console.log('exec error: ' + error);
					if (!!callback)
						callback({ 'error': true });
				} else {
					if (!!callback)
						callback({ success: true });
				}
			}
		);
	});
}

var interval;

camera.start_interval = function () {
	if (interval != null) {
		return;
	} else {
		interval = setInterval(function () {
			camera.shoot();
		}, 3000);
	}
}

camera.stop_interval = function () {
	if (interval == null) {
				return;
	} else {
		clearInterval(interval);
		interval = null;
	}
}

camera.get_config = function (name, callback) {
	if (!callback || typeof callback !== "function") {
		return;
	}

	var config = ['shutterspeed2', 'f-number', 'iso', 'whitebalance'];

	if (config.indexOf(name) == -1) {
		callback(false);
		return;
	}

	sem.take(function () {
		exec("gphoto2 --get-config " + name,
			function (error, stdout, stderr) {
				sem.leave();

				if (error == null) {
					lines = stdout.split(os.EOL);

					options = lines.filter(function (item) { return item != undefined && item.substr(0, 7) == "Choice:" })
						.map(function (obj) {
							return obj.substr(7).trim().split(" ", 2)[1];
						});
					value = lines.filter(function (item) { return item != undefined && item.substr(0, 8) == "Current:" });

					if (value.length == 1) {
						callback(value[0].substr(8).trim(), options);
						return;
					}
					callback(false);
				}
			}
		);
	});
}

camera.set_config = function (name, value, callback) {
	if (!callback || typeof callback !== "function") {
		return;
	}

	var config = ['shutterspeed2', 'f-number', 'iso', 'whitebalance'];

	if (config.indexOf(name) == -1) {
		callback(false);
		return;
	}

	sem.take(function () {
		exec("gphoto2 --set-config " + name + "=" + value,
			function (error, stdout, stderr) {
				sem.leave();

				if (error == null) {
					camera.get_config(name, callback);
				} else {
					callback(false);
				}
			}
		);
	});
}

module.exports = camera;
var gulp = require('gulp'),
    gutil = require('gulp-util'),
    nodemon = require('gulp-nodemon'),
    tap = require('gulp-tap'),
    run = require('gulp-run');

var childp = require("child_process");

gulp.task('devices', function() {
    return gulp.src('static/assets/devices.png')
        .pipe(tap(function(file) {
            var deviceMetaCmd = new run.Command('python utils/device-meta.py ' + file.path, {silent: true});
            file.contents = deviceMetaCmd.exec().contents;
            file.path = gutil.replaceExtension(file.path, '.json');
        }))
        .pipe(gulp.dest('static/assets/'));
});

gulp.task('devices-watch', function() {
    gulp.watch(["static/assets/devices.png",
                "utils/device-meta.py"], ['devices']);
});

gulp.task('serve', ['devices-watch'], function () {
	nodemon({
		script: 'server.js',
		ext: 'js',
		env: {
			'NODE_ENV': 'development',
		},
		verbose: false,
		watch: ["server.js"]
	});
});

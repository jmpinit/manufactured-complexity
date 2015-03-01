var gulp = require('gulp'),
    gutil = require('gulp-util'),
    nodemon = require('gulp-nodemon'),
    tap = require('gulp-tap'),
    run = require('gulp-run'),
    intermediate = require('gulp-intermediate'),
    streamify = require('gulp-streamify'),
    merge = require('merge-stream');

var childp = require("child_process");
var util = require('util');
var path = require('path');

gulp.task('static', function() {
    return gulp.src('static/**/*').pipe(gulp.dest('www'));
})

gulp.task('static-watch', ['static'], function() {
    gulp.watch(['static/**/*'], ['static']);
})

var deviceImagePath = 'images/devices.png';

gulp.task('devices', function() {
    var metadata = gulp.src(deviceImagePath)
        .pipe(tap(function(file) {
            var deviceMetaCmd = new run.Command('python utils/device-meta.py ' + file.path, {silent: true});
            file.contents = deviceMetaCmd.exec().contents;
            file.path = gutil.replaceExtension(file.path, '.json');
        }))
        .pipe(gulp.dest('www/data/'));

    var spritesheet = gulp.src(deviceImagePath)
        .pipe(streamify(intermediate({ output: '.' }, function (tempDir, cb, files) {
            var script = util.format('%s/utils/strip-meta.py', __dirname);

            var fn = path.basename(files[0].path);
            var source = path.join(tempDir, fn);
            var destination = source;

            var command = childp.spawn('python', [script, source, destination], { cwd: tempDir });
            command.on('close', cb);
        })))
        .pipe(gulp.dest('www/images/'));

    return merge(metadata, spritesheet);
});

gulp.task('devices-watch', ['devices'], function() {
    gulp.watch([deviceImagePath,
                'utils/device-meta.py'], ['devices']);
});

gulp.task('serve', ['devices-watch', 'static-watch'], function () {
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

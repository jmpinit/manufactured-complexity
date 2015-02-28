var gulp = require('gulp'),
    nodemon = require('gulp-nodemon');

gulp.task('serve', function () {
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

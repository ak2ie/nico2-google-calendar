const gulp = require('gulp');
const webserver = require('gulp-webserver');

gulp.task('webserver', function() {
    gulp.src('server')
        .pipe(webserver({
            host: 'localhost',
            port: 2525,
            livereload: true
        }));
});
var autoprefixer = require('gulp-autoprefixer');
var babelify = require('babelify');
var browserify = require('browserify');
var browserSync = require('browser-sync');
var concat = require('gulp-concat');
var connectFallback = require('connect-history-api-fallback');
var envify = require('envify/custom');
var gulp = require('gulp');
var minifyCss = require('gulp-minify-css');
var nib = require('nib');
var reactify = require('reactify');
var stylus = require('gulp-stylus');
var uglify = require('gulp-uglify');
var vinylBuffer = require('vinyl-buffer');
var vinylSource = require('vinyl-source-stream');
var watchify = require('watchify');
var webserver = require('gulp-webserver');


var bundler = browserify('./js/app.js', watchify.args)
  .transform(babelify.configure({
    optional: ['runtime']
  }))
  .transform(envify({
    API_ROOT: process.env.SHERLOCKED_API_ROOT ||
              'http://sherlocked.dev.mozaws.net/api/',
    CAPTURE_ROOT: process.env.SHERLOCKED_CAPTURE_ROOT ||
                  'http://sherlocked.dev.mozaws.net/',
    MEDIA_ROOT: process.env.SHERLOCKED_MEDIA_ROOT ||
                'http://sherlocked.dev.mozaws.net/'
  }))
  .transform(reactify);


gulp.task('css', function() {
  gulp
    .src(['css/*.styl', 'css/lib/*.css'])
    .pipe(stylus({compress: true, use: [nib()]}))
    .pipe(autoprefixer())
    .pipe(concat('bundle.css'))
    .pipe(minifyCss())
    .pipe(gulp.dest('build'))
    .pipe(browserSync.stream());
});


function jsBundle(bundler) {
  var bundle = bundler
    .bundle()
    .on('error', function(err) {
      console.log(err.message);
      console.log(err.codeFrame);
      this.emit('end');
    })
    .pipe(vinylSource('bundle.js'));

  if (process.env.NODE_ENV == 'production') {
    bundle = bundle
      .pipe(vinylBuffer())
      .pipe(uglify());
  }

  return bundle.pipe(gulp.dest('build'));
}


gulp.task('js', function() {
  return jsBundle(bundler);
});


gulp.task('serve', function() {
  browserSync.init({
    index: 'index.html',
    middleware: [connectFallback()],
    notify: false,
    open: false,
    server: './',
    port: process.env.SHERLOCKED_CLIENT_PORT || 2118
  });
});

gulp.task('watch', function() {
  bundler = watchify(bundler);

  bundler.on('update', function() {
    jsBundle(bundler);
  });
  bundler.on('log', console.log);

  gulp.watch('css/**/*.styl', ['css']);
});


gulp.task('build', ['css', 'js']);
gulp.task('default', ['css', 'js', 'serve', 'watch']);

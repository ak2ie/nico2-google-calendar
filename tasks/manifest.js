import gulp from 'gulp'
import gulpif from 'gulp-if'
import { colors, log } from 'gulp-util'
import livereload from 'gulp-livereload'
import jsonTransform from 'gulp-json-transform'
import plumber from 'gulp-plumber'
import applyBrowserPrefixesFor from './lib/applyBrowserPrefixesFor'
import args from './lib/args'
import replace from "gulp-replace";
import { CHROME_EXTENSION_CONFIG } from "./chrome_extension_config";

const ENV = args.production ? 'production' : 'development';

gulp.task('manifest', () => {
  return gulp.src('app/manifest.json')
    .pipe(plumber({
      errorHandler: error => {
        if (error) {
          log('manifest:', colors.red('Invalid manifest.json'))
        }
      }
    }))
    .pipe(gulpif(ENV === 'production', replace(CHROME_EXTENSION_CONFIG.key.dev, CHROME_EXTENSION_CONFIG.key.prod)))
    .pipe(gulpif(ENV === 'production', replace(CHROME_EXTENSION_CONFIG.client_id.dev, CHROME_EXTENSION_CONFIG.client_id.prod)))
    .pipe(gulpif(ENV === 'production', replace(/"http:\/\/localhost:2525\/",/, '')))
    .pipe(
      jsonTransform(
        applyBrowserPrefixesFor(args.vendor),
        2 /* whitespace */
      )
    )
    .pipe(gulp.dest(`dist/${args.vendor}`))
    .pipe(gulpif(args.watch, livereload()))
})

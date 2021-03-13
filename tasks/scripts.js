import gulp from "gulp";
import gulpif from "gulp-if";
import { log, colors } from "gulp-util";
import named from "vinyl-named";
import webpack from "webpack";
import gulpWebpack from "webpack-stream";
import plumber from "gulp-plumber";
import livereload from "gulp-livereload";
import args from "./lib/args";
import filter from "gulp-filter";

const ENV = args.production ? "production" : "development";

const strips = [
  "console.log",
  "console.info",
  "console.warn",
  "console.error",
  "console.assert",
]
  .map((strip) => `strip[]=${strip}`)
  .join(",");

/**
 * サービスワーカーJavaScriptファイル名
 */
const serviceworkerFileName = "serviceworker.js";
/**
 * スクリプトファイル用フィルター（サービスワーカー用ファイルを除く）
 */
const scriptsFilter = filter(["**", `!${serviceworkerFileName}`], {
  restore: true,
});
/**
 * サービスワーカーファイル用フィルター
 */
const serviceworkerFilter = filter([serviceworkerFileName], {
  restore: true,
});

gulp.task("scripts", (cb) => {
  return gulp
    .src([
      "app/scripts/serviceworker.ts",
      "app/scripts/contentscript.ts",
      "app/scripts/options.ts",
    ])
    .pipe(
      plumber({
        // Webpack will log the errors
        errorHandler() {},
      })
    )
    .pipe(named())
    .pipe(
      gulpWebpack(
        {
          devtool: args.sourcemaps ? "inline-source-map" : false,
          watch: args.watch,
          plugins: [
            new webpack.DefinePlugin({
              "process.env.NODE_ENV": JSON.stringify(ENV),
              "process.env.VENDOR": JSON.stringify(args.vendor),
            }),
          ].concat(
            args.production
              ? [
                  new webpack.optimize.UglifyJsPlugin(),
                  new webpack.optimize.ModuleConcatenationPlugin(),
                ]
              : []
          ),
          module: {
            rules: [
              {
                test: /\.ts$/,
                loader: "ts-loader",
                exclude: /node_modules/,
              },
              {
                test: /\.ts$/,
                loader: ENV === "development" ? [] : [`strip-loader?${strips}`],
                exclude: /node_modules/,
              },
            ],
          },
          resolve: {
            extensions: [".ts", ".js"],
            modules: ["node_modules/", "app/scripts/"],
          },
        },
        webpack,
        (err, stats) => {
          if (err) return;
          log(
            `Finished '${colors.cyan("scripts")}'`,
            stats.toString({
              chunks: false,
              colors: true,
              cached: false,
              children: false,
            })
          );
        }
      )
    )
    .pipe(scriptsFilter)
    .pipe(gulp.dest(`dist/${args.vendor}/scripts`))
    .pipe(scriptsFilter.restore)
    .pipe(serviceworkerFilter)
    .pipe(gulp.dest(`dist/${args.vendor}`))
    .pipe(gulpif(args.watch, livereload()));
});

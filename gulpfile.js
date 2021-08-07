// Очистка папки с картинками в build - gulp cleanImg
// конвектр шрифтов из otf в ttf - вызов отдельно -  gulp otf2ttf 
// Оптимизация иконок и сборка их в фаил - отдельный вызов командой  gulp svgSprite
// Автоматическbq перенос шрифтов в css -  gulp fontsStyle
// Очистка ВСЕЙ сборки -   gulp clean
// Сборка фаила js на прод - gulp webpackProd
// Сборка фаила js в режиме отладки  - gulp webpackDev

let project_folder = require("path").basename(__dirname);
let source_folder = "src";
const { on } = require("events");
let fs = require('fs');

let path = {
   build: {
      html: project_folder + "/",
      css: project_folder + "/css/",
      js: project_folder + "/js/",
      img: project_folder + "/img/",
      fonts: project_folder + "/fonts/",
   },

   src: {
      html: [source_folder + "/**/*.html", "!" + source_folder + "/**/_*.html"],
      css: source_folder + "/scss/style.scss",
      js: source_folder + "/js/script.js",
      img: source_folder + "/img/**/*.{jpg,png,svg,gif,ico,webp}",
      fonts: source_folder + "/fonts/*.ttf",
   },

   watch: {
      html: source_folder + "/**/*.html",
      css: source_folder + "/scss/**/*.scss",
      js: source_folder + "/js/**/*.js",
      img: source_folder + "/img/**/*.{jpg,png,svg,gif,ico,webp}",
   },

   clean: "./" + project_folder + "/"
};

let { src, dest } = require('gulp'),
   gulp = require('gulp'),
   browsersync = require("browser-sync").create(),
   fileinclud = require("gulp-file-include"),
   del = require("del"),
   scss = require('gulp-sass')(require('sass')),
   autoprefixer = require("gulp-autoprefixer"),
   group_media = require('gulp-group-css-media-queries'),
   clean_css = require('gulp-clean-css'),
   rename = require("gulp-rename"),
   uglify = require("gulp-uglify-es").default,
   imagemin = require('gulp-imagemin'),
   webp = require('gulp-webp'),
   webpHTML = require('gulp-webp-html'),
   webpCss = require('gulp-webp-css'),
   svgSprite = require('gulp-svg-sprite'),
   ttf2woff2 = require('gulp-ttf2woff2'),
   ttf2woff = require('gulp-ttf2woff'),
   fonter = require('gulp-fonter'),
   newer = require('gulp-newer'),
   sourcemaps = require('gulp-sourcemaps'),
   //шоб было в сборке сразу - подключается автоматом при компеляции
   jquery = require('jquery'),
   webpack = require('webpack-stream');

// упрвление webpack - продакшен
let webConfigProd = {
   output: {
      filename: 'script.min.js',
   },
   module: {
      rules: [
         {
            test: /\.js$/,
            loader: 'babel-loader',
            exclude: '/node_modules/'
         }
      ]
   },
   mode: 'production',
   devtool: 'eval-source-map'
   // devtool: 'false'
};

// упрвление webpack - девопс
let webConfigDev = {
   output: {
      filename: 'script.js'
   },
   module: {
      rules: [
         {
            test: /\.js?$/,
            exclude: /node_modules/,
            loader: 'babel-loader',
         }
      ]
   },
   mode: 'development',
   devtool: 'false'
}

// обработка js через webpack
async function webpackProd() {
   return src(path.src.js)
      .pipe(webpack(webConfigProd))
      .pipe(dest(path.build.js))
      .pipe(browsersync.stream())
}

async function webpackDev() {
   return src(path.src.js)
      .pipe(webpack(webConfigDev))
      .pipe(dest(path.build.js))
}

function browserSync() {
   browsersync.init({
      server: {
         baseDir: "./" + project_folder + "/"
      },
      port: 3000,
      notify: false,
      online: true // Режим работы: true или false для онлайн просмотра
   })
};

function html() {
   return src(path.src.html)
      .pipe(sourcemaps.init())
      .pipe(fileinclud())
      .pipe(webpHTML())
      .pipe(dest(path.build.html))
      .pipe(sourcemaps.write('./'))
      .pipe(browsersync.stream())
};

function css() {
   return src(path.src.css)
      .pipe(sourcemaps.init())
      .pipe(scss({ outputStyle: "expanded" })
      )
      .pipe(group_media())
      .pipe(
         autoprefixer({
            overrideBrowserslist: ["last 3 version"],
            cascade: true
         })
      )
      .pipe(webpCss())
      .pipe(dest(path.build.css))
      .pipe(clean_css())
      .pipe(rename({ extname: ".min.css" }))
      .pipe(sourcemaps.write('./'))
      .pipe(dest(path.build.css))
      .pipe(browsersync.stream())
};


function images() {
   return src(path.src.img)
      .pipe(newer(path.src.img))
      .pipe(
         webp({
            quality: 70
         }))
      .on("error", console.error.bind(console))
      .pipe(dest(path.build.img))
      .pipe(src(path.src.img))
      .pipe(
         imagemin({
            progressive: true,
            svgoPlugins: [{ removeViewBox: false }],
            interlaced: true,
            optimizationLevel: 3
         }))
      .on("error", console.error.bind(console))
      .pipe(dest(path.build.img))
      .pipe(browsersync.stream())
};

// Очистка папки с картинками - gulp cleanimg
function cleanImg() {
   return del(path.build.img + '*', { force: true })
}

function fonts() {
   src(path.src.fonts)
      .pipe(ttf2woff2())
      .pipe(dest(path.build.fonts))
   return src(path.src.fonts)
      .pipe(ttf2woff())
      .pipe(dest(path.build.fonts))
};

// конвектр шрифтов из otf в ttf - вызов отдельно - npm otf2ttf 
gulp.task('otf2ttf', function () {
   return src([source_folder + '/fonts/*.otf'])
      .pipe(fonter({
         formats: ['woff']
      }))
      .pipe(dest(path.build.fonts))
});

// Оптимизация иконок и сборка их в фаил - отдельный вызов командой npm svgSprite
gulp.task('svgSprite', function () {
   return gulp.src([source_folder + '/iconsprite/*.svg'])
      .pipe(svgSprite({
         mode: {
            stack: {
               sprite: "../icon/icons.svg",
               example: true // Создаем HTML с примерами иконок svg
            }
         }
      }))
      .pipe(dest(path.build.img))
});

// Автоматическbq перенос шрифтов в css
async function fontsStyle(params) {
   let file_content = fs.readFileSync(source_folder + '/scss/fonts.scss');
   fs.writeFile(source_folder + '/scss/fonts.scss', '', cb);
   return fs.readdir(path.build.fonts, function (err, items) {
      if (items) {
         let c_fontname;
         for (var i = 0; i < items.length; i++) {
            let fontname = items[i].split('.');
            fontname = fontname[0];
            if (c_fontname != fontname) {
               fs.appendFile(source_folder + '/scss/fonts.scss', '@include font("' + fontname + '", "' + fontname + '", "400", "normal");\r\n', cb);
            }
            c_fontname = fontname;
         }
      }
   })
}

function cb() { }

function watchFile() {
   gulp.watch([path.watch.html], html);
   gulp.watch([path.watch.css], css);
   gulp.watch([path.watch.js], webpackProd);
   gulp.watch([path.watch.img], images);
};

function clean() {
   return del(path.clean)

};

let build = gulp.series(clean, gulp.parallel(css, html, images, fonts), webpackDev, webpackProd, fontsStyle);
let watch = gulp.parallel(build, watchFile, browserSync);

exports.webpackProd = webpackProd;
exports.webpackDev = webpackDev;
exports.fontsStyle = fontsStyle;
exports.fonts = fonts;
exports.images = images;
exports.cleanImg = cleanImg;
exports.css = css;
exports.html = html;
exports.build = build;
exports.watch = watch;
exports.default = watch;

// Очистка папки с картинками в build - gulp cleanImg
// конвектр шрифтов из otf в ttf - вызов отдельно -  gulp otf2ttf 
// Оптимизация иконок и сборка их в фаил - отдельный вызов командой  gulp svgSprite
// Автоматическbq перенос шрифтов в css -  gulp fontsStyle
// Очистка ВСЕЙ сборки -   gulp clean
// Сборка фаила js на прод - gulp webpackProd
// Сборка фаила js в режиме отладки  - gulp webpackDev

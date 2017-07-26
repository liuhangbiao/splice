var fs = require('fs');
var Path = require("path");
var gulp = require('gulp');
var gulpif = require('gulp-if');
var postcss = require('gulp-postcss');
var minifyCSS = require('gulp-cssnano');
var rename = require('gulp-rename');
var autoprefixer = require('autoprefixer');
var uglify = require("gulp-uglify");
var htmlmin = require('gulp-htmlmin');

// 图片压缩
var imagemin = require('gulp-imagemin');
var pngquant = require('imagemin-pngquant');

// 精灵图处理
var spritesmith = require('gulp.spritesmith');
var buffer = require('vinyl-buffer');
var merge = require('merge-stream');

// usemin
var usemin = require('gulp-usemin2');
var cleanCSS = require('gulp-clean-css');

/**
 * -----------------------------------------------------------------
 * HTML 文件相关操作
 * -----------------------------------------------------------------
 */
/**
 * gulp-htmlmin - 压缩 html 文件
 * @author Alexee
 * @date   2017-07-22
 * @param  {gulp stream}   stream
 * @return {gulp stream}   stream
 */
var minifyHTML = (stream) => {
  return stream.pipe(htmlmin({ collapseWhitespace: true }))
}

/**
 * gulp-usemin gulp-rev - 合并 html 引用的 css、js
 * @author Alexee
 * @date   2017-07-26
 * @param  {[type]}   stream [description]
 * @return {[type]}          [description]
 */
var useminHTML = (stream, {isUglify, isRev}) => {
  return stream.pipe(usemin({
    // cssmin: cleanCSS(), // 使用 css 压缩会导致无法生成最终的 css 文件
    jsmin: isUglify && uglify() , 
    rev: isRev

    // 以下为 gulp-usemin 用法
    // css: [ minifyCSS(), rev() ],    
    // html: [ htmlmin({ collapseWhitespace: true }) ],
    // js: [ uglify(), rev() ],
    // inlinejs: [ uglify() ]
    // inlinecss: [ cleanCss(), 'concat' ]
  }))
}


/**
 * -----------------------------------------------------------------
 * CSS 文件相关操作
 * ----------------------------------------------------------------- 
 */
/**
 * gulp-postcss - 添加兼容性前缀
 * @author Alexee
 * @date   2017-07-21
 * @param  {gulp stream}   stream 
 * @return {gulp stream}   stream     
 */
var prefixCSS = (stream) => {
  return stream.pipe(postcss([autoprefixer({ browsers: ['last 4 versions'] })]));
}

/**
 * gulp-cssnano - 压缩 css 文件
 * @author Alexee
 * @date   2017-07-21
 * @param  {gulp stream}   stream 
 * @return {gulp stream}   stream
 */
var compressCSS = (stream) => {
  return stream.pipe(minifyCSS({
    safe: true,
    reduceTransforms: false,
    advanced: false,
    compatibility: 'ie7',
    keepSpecialComments: 0
  }));
}

/**
 * -----------------------------------------------------------------
 * JS 文件相关操作
 * -----------------------------------------------------------------
 */
/**
 * gulp-uglify - 压缩 js 文件
 * @author Alexee
 * @date   2017-07-22
 * @param  {gulp stream}   stream 
 * @return {gulp stream}   stream
 */
var uglifyJS = (stream) => {
  return stream.pipe(uglify({
    mangle: true, //类型：Boolean 默认：true 是否修改变量名
    compress: true //类型：Boolean 默认：true 是否完全压缩
  }))
}




/**
 * -----------------------------------------------------------------
 * IMAGE 文件相关操作
 * -----------------------------------------------------------------
 */
/**
 * gulp-imagemin - 压缩图片(PNG, JPEG, JPG, GIF and SVG)
 * @author Alexee
 * @date   2017-07-22
 * @param  {gulp stream}   stream
 * @return {gulp stream}   stream
 */
var imageminIMG = (stream) => {
  return stream.pipe(imagemin([
    imagemin.gifsicle({ interlaced: true }),
    imagemin.jpegtran({ progressive: true }),
    // imagemin.optipng({ optimizationLevel: 5 }),
    imagemin.svgo({ plugins: [{ removeViewBox: true }] }),
    pngquant()
  ]))
}

/**
 * gulp.spritesmith - 生成精灵图和对应的 css 文件
 * @author Alexee
 * @date   2017-07-22
 * @param  {gulp stream}   stream
 * @return {gulp stream}   stream
 */
var spriteIMG = (stream, {dest, imgName, cssName, imgPath, isImgMin, imgDest, isCssMin, cssDest}) => {
  // Generate our spritesheet
  var spriteData = stream.pipe(spritesmith({
    imgName: imgName,
    cssName: cssName,
    imgPath: imgPath,
    padding: 4
  }));

  // Pipe image stream through image optimizer and onto disk
  var imgStream = spriteData.img
    // DEV: We must buffer our stream into a Buffer for `imagemin`
    .pipe(buffer())
    .pipe(gulpif(isImgMin, imagemin()))
    .pipe(gulp.dest(Path.resolve(dest, imgDest)));

  // Pipe CSS stream through CSS optimizer and onto disk
  var cssStream = spriteData.css
  .pipe(gulpif(isCssMin, minifyCSS({
    safe: true,
    reduceTransforms: false,
    advanced: false,
    compatibility: 'ie7',
    keepSpecialComments: 0
  })))
  .pipe(gulp.dest(Path.resolve(dest, cssDest)));

  // Return a merged stream to handle both `end` events
  // return merge(imgStream, cssStream);
  return false;
}




/**
 * -----------------------------------------------------------------
 * 通用操作
 * -----------------------------------------------------------------
 */
/**
 * gulp-rename - 重命名
 * @author Alexee
 * @date   2017-07-26
 * @param  {gulp stream}   stream           
 * @param  {[type]}   options.basename [文件名]
 * @param  {[type]}   options.prefix   [前缀]
 * @param  {[type]}   options.suffix   [后缀]
 * @param  {[type]}   options.extname  [扩展名]
 * @return {[type]}                    [description]
 */
var renameALL = (stream, { basename, prefix, suffix, extname}) => {
  console.log(basename, prefix, suffix, extname);
  return stream.pipe(rename({
    basename: basename,
    prefix: prefix,
    suffix: suffix,
    extname: extname
  }))
}

/**
 * 不执行任何操作
 * @author Alexee
 * @date   2017-07-26
 * @param  {[type]}   stream [description]
 * @return {[type]}          [description]
 */
var doNothing = (stream) => {
  return stream;
}



const FUNCS = {
  // html
  'htmlmin': minifyHTML,
  'usemin': useminHTML,
  // css
  'prefix': prefixCSS,
  'compress': compressCSS,
  // js
  'uglify': uglifyJS,
  // image
  'imagemin': imageminIMG,
  'sprite': spriteIMG,
  // common
  'rename': renameALL,
  'dest': doNothing
}

/**
 * 处理 html 文件
 * @author Alexee
 * @date   2017-07-22
 * @param  {array}   actionsName  [需要执行的操作]
 * @param  {string}   src         [处理的文件地址]
 * @param  {string}   dist        [文件导出地址]
 * @param  {object}   configs     [操作设置]
 * @param  {Function} callback    [文件处理完的回调函数]
 * @return {[type]}               [description]
 */
var handleHTML = (actionsName, src, dist, configs, callback) => {
  console.log(actionsName, src, dist, configs, callback);
  let stream = gulp.src(src);
  actionsName.forEach(function(element) {
    console.log(`执行操作：${element}`);
    stream = FUNCS[element](stream, configs);
  })
    return stream.pipe(gulp.dest(dist));
}



/**
 * 处理 css 文件
 * @author Alexee
 * @date   2017-07-22
 * @param  {array}   actionsName  [需要执行的操作]
 * @param  {string}   src         [处理的文件地址]
 * @param  {string}   dist        [文件导出地址]
 * @param  {string}   configs     [操作设置]
 * @param  {Function} callback    [文件处理完的回调函数]
 * @return {[type]}               [description]
 */
var handleCSS = (actionsName, src, dist, configs, callback) => {
  console.log(actionsName, src, dist, configs, callback);
  let stream = gulp.src(src);
  actionsName.forEach(function(element) {
    console.log(`执行操作：${element}`);
    stream = FUNCS[element](stream, configs);
  })
  return stream.pipe(gulp.dest(dist));
}

/**
 * 处理 js 文件
 * @author Alexee
 * @date   2017-07-22
 * @param  {array}   actionsName  [需要执行的操作]
 * @param  {string}   src         [处理的文件地址]
 * @param  {string}   dist        [文件导出地址]
 * @param  {string}   configs     [操作设置]
 * @param  {Function} callback    [文件处理完的回调函数]
 * @return {[type]}               [description]
 */
var handleJS = (actionsName, src, dist, configs, callback) => {
  let stream = gulp.src(src);
  actionsName.forEach(function(element) {
    console.log(`执行操作：${element}`);
      stream = FUNCS[element](stream, configs);
  })
  return stream.pipe(gulp.dest(dist));
}

/**
 * 处理 image 文件
 * @author Alexee
 * @date   2017-07-22
 * @param  {array}   actionsName  [需要执行的操作]
 * @param  {string}   src         [处理的文件地址]
 * @param  {string}   dist        [文件导出地址]
 * @param  {string}   configs     [操作设置]
 * @param  {Function} callback    [文件处理完的回调函数]
 * @return {[type]}               [description]
 */
var handleIMG = (actionsName, src, dist, configs, callback) => {
  let stream = gulp.src(src);
  actionsName.forEach(function(element) {
    console.log(`执行操作：${element}`);
    stream = FUNCS[element](stream, configs);
  })
  // 精灵图操作 stream 返回 false
  if (stream) {
    return stream.pipe(gulp.dest(dist));
  }
}


/**
 * 处理 所有 文件
 * @author Alexee
 * @date   2017-07-22
 * @param  {array}   actionsName  [需要执行的操作]
 * @param  {string}   src         [处理的文件地址]
 * @param  {string}   dist        [文件导出地址]
 * @param  {string}   configs     [操作设置]
 * @param  {Function} callback    [文件处理完的回调函数]
 * @return {[type]}               [description]
 */
 var handleALL = (actionsName, src, dist, configs, callback) => {
  let stream = gulp.src(src);
  actionsName.forEach(function(element) {
    console.log(`执行操作：${element}`);
    stream = FUNCS[element](stream, configs);
  })
  return stream.pipe(gulp.dest(dist));
}

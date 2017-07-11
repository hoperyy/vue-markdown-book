
const path = require('path');
const fs = require('fs');
const webpack = require('webpack');
const gulp = require('gulp');
const fse = require('fs-extra');

const srcFolder = path.join(__dirname, 'src');
const buildFolder = path.join(__dirname, 'build');

gulp.task('dev', function() {

    fse.removeSync(buildFolder);

    const webpackDevServer = require('webpack-dev-server');
    const webpackConfig = require('./webpack.config')('dev', srcFolder, buildFolder);

    const server = new webpackDevServer(webpack(webpackConfig), {
        contentBase: buildFolder,
        hot: true,
        historyApiFallback: true,
        quiet: false,
        noInfo: false,
        stats: {
            chunks: false,
            colors: true
        },
        publicPath: webpackConfig.output.publicPath,
        disableHostCheck: true,
        watchOptions: {
            ignored: /\/node_modules\//,
            poll: 300
        }
    });

    server.listen(9000);

});

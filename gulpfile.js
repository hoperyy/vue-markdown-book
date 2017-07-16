
const path = require('path');
const fs = require('fs');
const webpack = require('webpack');
const gulp = require('gulp');
const fse = require('fs-extra');

const srcFolder = path.join(__dirname, 'src');
const buildFolder = path.join(__dirname, 'build');

// get default webpack config
const webpackConfig = require('./webpack.config')(srcFolder, buildFolder);

const prepareBuild = () => {

    // remove build folder
    fse.removeSync(buildFolder);

    // create *.html in build folder
    fs.readdirSync(srcFolder).forEach((filename) => {
        const stats = fs.statSync(path.join(srcFolder, filename));

        // 目前只对文件夹内的 html 有效
        if (stats.isDirectory()) {
            const foldername = filename;
            const subFiles = fs.readdirSync(path.join(srcFolder, foldername));

            subFiles.forEach((subname) => {
                const subStats = fs.statSync(path.join(srcFolder, foldername, subname));

                if (!subStats.isDirectory() && /\.html*/.test(subname)) {
                    fse.copySync(path.join(srcFolder, foldername, subname), path.join(buildFolder, foldername + '.html'));
                }
            });
        }

    });

    gulp.watch([path.join(srcFolder, '**/*.html')], (stats) => {
        const filepath = stats.path;
        const basename = path.basename(filepath);
        const foldername = path.basename(path.dirname(filepath));
        fse.copySync(filepath, path.join(buildFolder, foldername + '.html'));
    });
};

const prepareMap = () => {

    // prepare snippets
    console.log('Preparing maps of snippets...');
    
    console.log('Preparation done.');

};

gulp.task('dev', () => {

    const WebpackDevServer = require('webpack-dev-server');
    const port = 9000;

    prepareBuild();

    prepareMap();

    // HMR
    webpackConfig.plugins.push(new webpack.HotModuleReplacementPlugin());

    // rules
    webpackConfig.module.rules.forEach((item) => {

        if (item.test.test('.css')) {
            item.use = ['vue-style-loader', 'css-loader', 'postcss-loader'];
        } else if (item.test.test('.less')) {
            item.use = ['vue-style-loader', 'css-loader', 'postcss-loader', 'less-loader'];
        } else if (item.test.test('.vue')) {
            item.options.loaders.css = ['vue-style-loader', 'css-loader', 'postcss-loader'];
            item.options.loaders.less = ['vue-style-loader', 'css-loader', 'postcss-loader', 'less-loader'];
        }

    });

    for(let i in webpackConfig.entry) {
        webpackConfig.entry[i].unshift(`webpack-dev-server/client?http://127.0.0.1:${port}`, 'webpack/hot/dev-server');
    }

    const server = new WebpackDevServer(webpack(webpackConfig), {
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

    server.listen(port);

});


gulp.task('build', () => {

    prepareBuild();

    prepareMap();

    webpack(webpackConfig, function() {});

});

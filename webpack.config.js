
const path = require('path');
const fs = require('fs');

const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const StringReplacePlugin = require('string-replace-webpack-plugin');

function getEntry(root) {

    const files = fs.readdirSync(root);

    const entry = { vendor: ['vue', 'vue-router'] };

    files.forEach((filename) => {
        const filepath = path.join(root, filename);
        if (fs.statSync(filepath).isDirectory()) {
            if (fs.existsSync(path.join(filepath, 'index.html'))) {

                if (/\-iframe/.test(filename)) {
                    entry['iframe'] = [path.join(root, filename, 'index.js')];
                } else {
                    entry['index'] = [path.join(root, filename, 'index.js')];
                }

            }
        }
    });

    return entry;
}

module.exports = (docFolder, codeFolder, buildFolder, urlRoot) => {

    const entry = getEntry(codeFolder);

    const config = {
            entry: entry,
            output: {
                path: path.join(buildFolder, 'static'),
                publicPath: `${urlRoot}/static/`,
                filename: '[name].js',
                chunkFilename: '[name].js'
            },
            resolve: {
                mainFields: ['browser', 'module', 'jsnext:main', 'main'],
                alias: {
                    vue: 'vue/dist/vue.js',
                },
                modules: [
                    // path.resolve(docFolder, 'node_modules/'),      // 工作目录的依赖
                    path.resolve(codeFolder, 'node_modules/'),
                    path.resolve(__dirname, 'node_modules/')    // 脚手架的依赖
                ]
            },
            resolveLoader: {
                modules: [
                    // path.resolve(docFolder, 'node_modules/'),      // 工作目录的依赖
                    path.resolve(codeFolder, 'node_modules/'),
                    path.resolve(__dirname, 'node_modules/')     // 脚手架的依赖
                ]
            },
            module: {
                rules: [{
                test: /\.jpg$/,
                use: 'url-loader?name=img/[hash].[ext]&mimetype=image/jpg&limit=8000'
            }, {
                test: /\.png$/,
                use: 'url-loader?name=img/[hash].[ext]&mimetype=image/png&limit=8000'
            }, {
                test: /\.gif$/,
                use: 'url-loader?name=img/[hash].[ext]&mimetype=image/gif&limit=8000'
            }, {
                test: /\.(woff|svg|eot|ttf)\??.*$/,
                use: 'url-loader?name=img/[hash].[ext]&limit=10'
            }, {
                test: /\.md$/,
                loader: 'vue-markdown-loader',
                options: {
                    // markdown-it config
                    preset: 'default',
                    breaks: true,
                    preprocess: function(markdownIt, source) {
                        // do any thing
                        return source
                    },
                    use: [
                        /* markdown-it plugin */
                        // require('markdown-it-xxx'),
                        /* or */
                        // [require('markdown-it-xxx'), 'this is options']
                    ]
                }
            }, {
                test: /\.css$/,
                use: ExtractTextPlugin.extract({
                    use: ['css-loader?minimize', 'postcss-loader'],
                    fallback: 'vue-style-loader'
                })
            }, {
                test: /\.less$/,
                use: ExtractTextPlugin.extract({
                    use: ['css-loader?minimize', 'postcss-loader', 'less-loader'],
                    fallback: 'vue-style-loader'
                })
            }, {
                test: /\.vue$/,
                loader: 'vue-loader',
                options: {
                    loaders: {
                        css: ExtractTextPlugin.extract({
                            use: ['css-loader?minimize', 'postcss-loader'],
                            fallback: 'vue-style-loader'
                        }),
                        less: ExtractTextPlugin.extract({
                            use: ['css-loader?minimize', 'postcss-loader', 'less-loader'],
                            fallback: 'vue-style-loader'
                        })
                    }
                }
            }, {
                test: /\.js$/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: [ "es2015" ]
                    }
                },
                include: [
                    codeFolder,
                    docFolder
                ]
            }]},
            plugins: [
                new webpack.optimize.CommonsChunkPlugin({
                    name: 'vendor',
                    filename: 'common.js',
                    minChunks: Infinity,
                }),
                // new StringReplacePlugin(),
                new ExtractTextPlugin({
                    filename: '[name].css',
                    disable: false
                }),
                new StringReplacePlugin()
            ]
    };

    return config;
};


const path = require('path');
const fs = require('fs');

const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

function getEntry(root) {

    const files = fs.readdirSync(root);

    const entry = { vendor: ['vue', 'vue-router'] };

    files.forEach((filename) => {
        const filepath = path.join(root, filename);
        if (fs.statSync(filepath).isDirectory()) {
            if (fs.existsSync(path.join(filepath, 'index.html'))) {
                  entry[filename + '/index'] = [path.join(root, filename, 'index.js')];
            }
        }
    });

    return entry;
}

module.exports = (srcFolder, buildFolder) => {

    // 获取入口
    const entry = getEntry(srcFolder);

		const config = {
				entry: entry,
        output: {
            path: path.join(buildFolder, 'static'),
            publicPath: '/website/static/',
            filename: '[name].js',
            chunkFilename: '[name].js'
        },
        resolve: {
            mainFields: ['browser', 'module', 'jsnext:main', 'main'],
            alias: {
                vue: 'vue/dist/vue.js',
            }
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
                        preprocess: function(markdownIt, source) {
                          return source;
                        },
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
                    include: [
                        srcFolder
                    ],
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
                    loader: 'babel-loader',
                    include: [
                        srcFolder
                    ]
                }]
				},
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
            })
        ]
		};

		return config;
};

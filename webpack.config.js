
const path = require('path');
const fs = require('fs');

const webpack = require('webpack');
const StringReplacePlugin = require('string-replace-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');


function getEntry(root) {

    const files = fs.readdirSync(root);

    const entry = { vendor: ['vue', 'vue-router'] };

    files.forEach((filename) => {
        if (fs.statSync(path.join(root, filename)).isDirectory()) {
            entry[filename + '/index'] = [path.join(root, filename, 'index.js')];
        }
    });

    return entry;
}

module.exports = (env, srcFolder, buildFolder) => {

    const isDev = env === 'dev' ? true : false;

    // 获取入口
    const entry = getEntry(srcFolder);

    const plugins = [
        new webpack.optimize.CommonsChunkPlugin({
            name: 'vendor',
            filename: 'common.js',
            minChunks: Infinity,
        }),
        new StringReplacePlugin(),
        new ExtractTextPlugin({
            filename: '[name].css',
            disable: false
        })
    ];

    if (isDev) {
        plugins.push(new webpack.HotModuleReplacementPlugin())
    }

		const config = {
				entry: entry,
        output: {
            path: path.join(buildFolder, 'static'),
            publicPath: 'static',
            filename: '[name].js',
            chunkFilename: '[name].js'
        },
        resolve: {
            mainFields: ['jsnext:main', 'main'],
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
    								loader: 'vue-markdown-loader'
    						}, {
                    test: /\.css$/,
                    use: isDev ? ['vue-style-loader', 'css-loader', 'postcss-loader'] : ExtractTextPlugin.extract({
                        use: ['css-loader?minimize', 'postcss-loader'],
                        fallback: 'vue-style-loader'
                    })
                }, {
                    test: /\.less$/,
                    use: isDev ? ['vue-style-loader', 'css-loader', 'postcss-loader', 'less-loader'] : ExtractTextPlugin.extract({
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
                            css: isDev ? ['vue-style-loader', 'css-loader', 'postcss-loader'] : ExtractTextPlugin.extract({
                                use: ['css-loader?minimize', 'postcss-loader'],
                                fallback: 'vue-style-loader'
                            }),
                            less: isDev ? ['vue-style-loader', 'css-loader', 'postcss-loader', 'less-loader'] : ExtractTextPlugin.extract({
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
				plugins: plugins
		};

		return config;
};

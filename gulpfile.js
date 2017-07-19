
const path = require('path');
const fs = require('fs');
const webpack = require('webpack');
const gulp = require('gulp');
const fse = require('fs-extra');
const readdirSync = require('recursive-readdir-sync');

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
                    try {
                      fse.copySync(path.join(srcFolder, foldername, subname), path.join(buildFolder, foldername + '.html'));
                    } catch(err) {
                      console.log('error: ', err, ' \n and subname is: ', subname);
                    }
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

const prepareSnippets = () => {

    const md5 = require('md5');

    // prepare snippets
    console.log('Preparing snippets...');

    // clear
    if (fs.existsSync('./src/snippets/dynamic-files')) {
        fse.removeSync('./src/snippets/dynamic-files');
    }

    // prepare dynamic-routes
    const snippetsFiles = readdirSync('./docs/snippets');
    const dirTree = require('directory-tree')('./docs/snippets/');

    // format dir tree path
    const formateDirTreePath = (tree) => {

        tree.children.forEach((item, index) => {

            // format path to '/docs/snippets/...'
            if (/^\.\//.test(item.path)) {
                item.path = item.path.replace(/^\.\//, '');
            }
            if (/^\.\//.test(tree.path)) {
                tree.path = tree.path.replace(/^\.\//, '');
            }
            if (!/^\//.test(item.path)) {
                item.path = '/' + item.path;
            }
            if (!/^\//.test(tree.path)) {
                tree.path = '/' + tree.path;
            }

            item.routePath = item.path.replace('/docs/snippets', '').replace(/\.md$/, '');

            if (item.children) {
                formateDirTreePath(item, item.index);
            }

        });
    };

    const getIndexMap = () => {

        const indexMap = {};

        const act = (tree, fileIndex) => {

          tree.children.forEach((item, index) => {

              item.index = fileIndex + '-' + index;

              // format
              if (/^-/.test(item.index)) {
                item.index = item.index.replace(/^-/, '');
              }

              indexMap[item.path] = item.index;

              if (item.children) {
                  act(item, item.index);
              }

          });

      };

      act(dirTree, '');

      return indexMap;
    };

    formateDirTreePath(dirTree);

    const indexMap = getIndexMap();

    const createDynamicFiles = () => {

      const hashMap = {};

      snippetsFiles.forEach((filepath) => {

          // formate
          if (!/^\//.test(filepath)) {
            filepath = '/' + filepath;
          }

          const filename = path.basename(filepath);
          const foldername = path.dirname(filepath);
          const md5String = md5(filepath);

          hashMap[md5String] = filepath;

          const fileIndex = JSON.stringify(indexMap[filepath].split('-')).replace(/\"/g, "'");

          // create dynamic-routes files
          const dynamicFilePath = path.join('./src/snippets/dynamic-files', md5String + '.vue');
          const content = `
            <template>
                <div>
                    <Mheader></Mheader>
                    <Mmenu :currentIndex="${fileIndex}"></Mmenu>
                    <Snippet></Snippet>
                    <Mfooter></Mfooter>
                </div>
            </template>

            <script>
            import Mheader from '../../components/Header.vue';
            import Mfooter from '../../components/Footer.vue';
            import Mmenu from '../components/Menu.vue';

            import Snippet from '../../..${filepath}';

            export default {
                components: {
                    Mheader,
                    Mfooter,
                    Mmenu,
                    Snippet
                }
            };

            </script>
          `;

          fse.ensureFileSync(dynamicFilePath);
          const fd = fs.openSync(dynamicFilePath, 'w+');
          fs.writeFileSync(dynamicFilePath, content);

          // prevent multi callback in webpack
          fs.utimesSync(dynamicFilePath, ((Date.now() - 10 * 1000)) / 1000, (Date.now() - 10 * 1000) / 1000);
          fs.close(fd);

      });

      return hashMap;
    };

    const createRoutesFile = (map) => {
        // 创建 routes.js
        const routesFilePath = './src/snippets/dynamic-files/routes.js';
        let routesContent = ``;
        for (md5String in map) {
            routesContent += `\nimport ${'doc_' + md5String} from './${md5String}.vue';`;
        }

        routesContent += `\n\nmodule.exports = [\n`;
        for (md5String in map) {
            routesContent += `{
              path: '${map[md5String].replace('/docs/snippets', '').replace(/\.md$/, '')}',
              component: ${'doc_' + md5String}
            },`;
        }
        routesContent = routesContent.replace(/\,$/, '');
        routesContent += '\n];';

        fse.ensureFileSync(routesFilePath);
        const fd = fs.openSync(routesFilePath, 'w+');

        fs.writeFileSync(routesFilePath, routesContent);

        // prevent multi callback in webpack
        fs.utimesSync(routesFilePath, ((Date.now() - 10 * 1000)) / 1000, (Date.now() - 10 * 1000) / 1000);

        fs.close(fd);
    };

    const hashMap = createDynamicFiles();
    createRoutesFile(hashMap);

    // create file-tree.js
    const createFileTree = () => {

        const dirTreeFilePath = path.join('./src/snippets/dynamic-files/file-tree.js');
        fse.ensureFileSync(dirTreeFilePath);
        const fd = fs.openSync(dirTreeFilePath, 'w');

        const contentStr = JSON.stringify(dirTree).replace(/docs\/snippets\//g, '');

        fs.writeFileSync(dirTreeFilePath, `module.exports=${contentStr}`);
        fs.utimesSync(dirTreeFilePath, ((Date.now() - 10 * 1000)) / 1000, (Date.now() - 10 * 1000) / 1000);
        fs.close(fd);
    };

    createFileTree();

    console.log('Snippets preparation done.');

};

gulp.task('dev', () => {

    const WebpackDevServer = require('webpack-dev-server');
    const port = 9000;

    prepareBuild();

    prepareSnippets();

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

    prepareSnippets();

    webpack(webpackConfig, function() {});

});

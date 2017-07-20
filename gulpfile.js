
const path = require('path');
const fs = require('fs');
const webpack = require('webpack');
const gulp = require('gulp');
const gulpWatch = require('gulp-watch');
const fse = require('fs-extra');
const readdirSync = require('recursive-readdir-sync');
const md5 = require('md5');
const readdirTree = require('directory-tree');

const srcFolder = path.join(__dirname, 'src');
// const buildFolder = path.join(__dirname, 'build');
const buildFolder = path.join(__dirname, '../snippets-site');
const docFolder = path.join(__dirname, 'docs');
const templateFolder = path.join(__dirname, 'template');

const utime = (filepath) => {
  fs.utimesSync(filepath, ((Date.now() - 10 * 1000)) / 1000, (Date.now() - 10 * 1000) / 1000);
};

const prepareBuildFolder = () => {

    // remove build folder
    fse.ensureDirSync(buildFolder);
    fs.readdirSync(buildFolder).forEach((filename) => {
      if (!/(\.DS_Store)|(\.git)/.test(filename)) {
        try {
          fse.removeSync(path.join(buildFolder, filename));
        } catch(err) {

        }
      }
    });

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

};

const prepareSrc = (docName) => {

    const currentDocFolder = path.join(docFolder, docName);
    const currentDocFiles = [];
    readdirSync(currentDocFolder).forEach((item) => {
      if (!/\/assets/.test(item)) {
        currentDocFiles.push(item);
      }
    });
    const dirTree = readdirTree(currentDocFolder, {
      exclude: /\/assets/
    });

    // create src pages by docs folder
    const createPage = () => {
      const targetFolder = path.join(srcFolder, docName);
      if (fs.existsSync(targetFolder)) {
        fse.removeSync(targetFolder);
      }
      fse.copySync(path.join(templateFolder, 'page-demo'), targetFolder);

      // replace string
      const htmlPath = path.join(targetFolder, 'index.html');
      const fd = fs.openSync(htmlPath, 'r');
      const newHtmlContent = fs.readFileSync(htmlPath).toString().replace(/\$\$\_\_DOCNAME\_\_\$\$/g, docName);
      fs.writeFileSync(htmlPath, newHtmlContent);
      fs.close(fd);

      const files = readdirSync(targetFolder);

      files.forEach((filepath) => {
        utime(filepath);
      });
    };

    // format path to '/xxx/xxx'
    const formatePath = () => {

        // format into relative path
        currentDocFiles.forEach((filepath, index) => {

            // currentDocFiles[index] = filepath.replace(currentDocFolder, '');
            filepath = filepath.replace(currentDocFolder, '');

            if (!/^\//.test(filepath)) {
                filepath = '/' + filepath;
            }

            currentDocFiles[index] = filepath;

        });

        const formateDirTree = (tree) => {

          tree.children.forEach((item, index) => {

              // format path to '/xxx/xxx/...'
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

              item.path = item.path.replace(currentDocFolder, '');
              tree.path = tree.path.replace(currentDocFolder, '');

              item.routePath = item.path.replace(currentDocFolder, '').replace(/\.md$/, '');

              if (item.children) {
                  formateDirTree(item, item.index);
              }

          });

        };

        formateDirTree(dirTree);

    };

    // get index map
    const getFilesMap = () => {

        const filesMap = {};

        const act = (tree, fileIndex) => {

          tree.children.forEach((item, index) => {

              item.index = fileIndex + '-' + index;

              // format
              if (/^-/.test(item.index)) {
                item.index = item.index.replace(/^-/, '');
              }

              filesMap[item.path] = item;

              if (item.children) {
                  act(item, item.index);
              }

          });

      };

      act(dirTree, '');

      return filesMap;
    };

    // create dynamic-files in src for sources to load
    const createDynamicFiles = (filesMap) => {

      const hashMap = {};

      currentDocFiles.forEach((filepath) => {

          // formate
          if (!/^\//.test(filepath)) {
            filepath = '/' + filepath;
          }

          const filename = path.basename(filepath);
          const foldername = path.dirname(filepath);
          const md5String = md5(filepath);

          hashMap[md5String] = filepath;

          const fileIndex = JSON.stringify(filesMap[filepath].index.split('-')).replace(/\"/g, "'");

          // create dynamic-routes files
          const dynamicFilePath = path.join(srcFolder, docName, 'dynamic-files', md5String + '.vue');

          const content = `
            <template>
                <div class="hoper-body">

                    <div class="hoper-content">
                        <Mmenu :currentIndex="${fileIndex}"></Mmenu>
                        <div class="hoper-doc">
                          <Doc></Doc>
                        </div>
                    </div>

                </div>
            </template>

            <script>
            import Mheader from '../../components/Header.vue';
            import Mfooter from '../../components/Footer.vue';
            import Mmenu from '../components/Menu.vue';

            import Doc from '${path.join(currentDocFolder, filepath)}';

            export default {
                components: {
                    Mheader,
                    Mfooter,
                    Mmenu,
                    Doc
                }
            };

            </script>
          `;

          fse.ensureFileSync(dynamicFilePath);
          const fd = fs.openSync(dynamicFilePath, 'w+');
          fs.writeFileSync(dynamicFilePath, content);

          // prevent multi callback in webpack
          utime(dynamicFilePath);
          fs.close(fd);

      });

      return hashMap;
    };

    // create vue routes
    const createRoutesFile = (hashMap, filesMap) => {
        // 创建 routes.js
        const routesFilePath = path.join(srcFolder, docName, '/dynamic-files/routes.js');
        let routesContent = ``;
        for (md5String in hashMap) {
            routesContent += `\nimport ${'doc_' + md5String} from './${md5String}.vue';`;
        }

        routesContent += `\n\nmodule.exports = [\n`;
        for (md5String in hashMap) {
            routesContent += `{
              path: '${filesMap[hashMap[md5String]].routePath}',
              component: ${'doc_' + md5String}
            },`;
        }
        routesContent = routesContent.replace(/\,$/, '');
        routesContent += '\n];';

        fse.ensureFileSync(routesFilePath);
        const fd = fs.openSync(routesFilePath, 'w+');

        fs.writeFileSync(routesFilePath, routesContent);

        // prevent multi callback in webpack
        utime(routesFilePath);

        fs.close(fd);
    };

    // create file-tree.js
    const createFileTree = () => {

        const dirTreeFilePath = path.join(path.join(srcFolder, docName, '/dynamic-files/file-tree.js'));
        fse.ensureFileSync(dirTreeFilePath);
        const fd = fs.openSync(dirTreeFilePath, 'w');

        const contentStr = JSON.stringify(dirTree);

        fs.writeFileSync(dirTreeFilePath, `module.exports=${contentStr}`);
        fs.utimesSync(dirTreeFilePath, ((Date.now() - 10 * 1000)) / 1000, (Date.now() - 10 * 1000) / 1000);
        fs.close(fd);
    };

    // clear dynamic-files
    if (fs.existsSync(path.join(srcFolder, docName, 'dynamic-files'))) {
        fse.removeSync(path.join(srcFolder, docName, 'dynamic-files'));
    }

    createPage();
    formatePath();
    const filesMap = getFilesMap();
    const hashMap = createDynamicFiles(filesMap);
    createRoutesFile(hashMap, filesMap);

    createFileTree();

};

const transferDoc2Src = () => {

  // clear src folder
  const srcFiles = fs.readdirSync(srcFolder);

  srcFiles.forEach((filename) => {
     if (!/(components)|(libs)/.test(filename)) {
       try {
         fse.removeSync(path.join(srcFolder, filename));
       } catch(err) {

       }
     }
  });

  const docs = fs.readdirSync(docFolder);

  docs.forEach((docName) => {
    prepareSrc(docName);
  });
};

gulp.task('dev', () => {

    const WebpackDevServer = require('webpack-dev-server');
    const port = 9000;

    transferDoc2Src();

    prepareBuildFolder();

    gulpWatch([path.join(srcFolder, '**/*.html')], (stats) => {
        const filepath = stats.path;
        const basename = path.basename(filepath);
        const foldername = path.basename(path.dirname(filepath));

        if (stats.event !== 'unlink') {
          fse.copySync(filepath, path.join(buildFolder, foldername + '.html'));
        } else {
          fse.removeSync(path.join(buildFolder, foldername + '.html'));
        }

    });

    // get default webpack config
    const webpackConfig = require('./webpack.config')(srcFolder, buildFolder);

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

    transferDoc2Src();

    prepareBuildFolder();

    // get default webpack config
    const webpackConfig = require('./webpack.config')(srcFolder, buildFolder);

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

    webpack(webpackConfig, function() {});

});

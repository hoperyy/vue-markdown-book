
const path = require('path');
const fs = require('fs');
const webpack = require('webpack');
const gulp = require('gulp');
const gulpWatch = require('gulp-watch');
const fse = require('fs-extra');
const md5 = require('md5');
const readdirTree = require('directory-tree');
const readdirEnhanced = require('readdir-enhanced').sync;
const readdirSync = (dir) => {
  return readdirEnhanced(dir, {
    deep: true,
    basePath: dir
  });
};

const srcFolder = path.join(__dirname, 'src');
// const buildFolder = path.join(__dirname, 'build');
const buildFolder = path.join(__dirname, '../snippets-site');
const docFolder = path.join(__dirname, 'docs');
const templateFolder = path.join(__dirname, 'template');

const utime = (filepath) => {
  fs.utimesSync(filepath, ((Date.now() - 10 * 1000)) / 1000, (Date.now() - 10 * 1000) / 1000);
};

const emptyBuildFolder = () => {
    fse.ensureDirSync(buildFolder);
    fs.readdirSync(buildFolder).forEach((filename) => {
      if (!/(\.DS_Store)|(\.git)/.test(filename)) {
        try {
          fse.removeSync(path.join(buildFolder, filename));
        } catch(err) {

        }
      }
    });
};

const createHtmlInBuildFolder = () => {

    // create *.html in build folder
    fs.readdirSync(srcFolder).forEach((filename) => {
        const stats = fs.statSync(path.join(srcFolder, filename));

        // only working for .html file in folders
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

const replaceKeywords = (docName, currentEnv) => {
    const targetFolder = path.join(srcFolder, docName);
    const htmlPath = path.join(targetFolder, 'index.html');
    const fd = fs.openSync(htmlPath, 'r');
    const newHtmlContent = fs.readFileSync(htmlPath)
                              .toString()
                              .replace(/\$\$\_DOCNAME\_\$\$/g, docName)
                              .replace(/\$\$\_CDNURL\_\$\$/g, currentEnv === 'is-build' ? './static' : './website/static');
    fs.writeFileSync(htmlPath, newHtmlContent);
    fs.close(fd);

    readdirSync(targetFolder).forEach((filepath) => {
      utime(filepath);
    });
};

const createPageFromDemo = (docName) => {
  const targetFolder = path.join(srcFolder, docName);
  if (fs.existsSync(targetFolder)) {
    fse.removeSync(targetFolder);
  }
  fse.copySync(path.join(templateFolder, 'page-demo'), targetFolder);

  readdirSync(targetFolder).forEach((filepath) => {
    utime(filepath);
  });

};

// get dir tree
const getFormatedDirTree = (currentDocFolder) => {

    // get dir tree
    const dirTree = readdirTree(currentDocFolder);

    // format dir tree path
    const formateDirTree = (tree, fileIndex) => {

      tree.children.forEach((item, index) => {

          // format into relative path
          item.path = item.path.replace(currentDocFolder, '');
          tree.path = tree.path.replace(currentDocFolder, '');

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

          // add absolute path
          item.absolutePath = path.join(currentDocFolder, item.path);
          tree.absolutePath = path.join(currentDocFolder, tree.path);

          // add md5 string
          item.md5String = md5(item.absolutePath);
          tree.md5String = md5(tree.absolutePath);

          // add index
          item.index = fileIndex + '-' + index;

          // format index to 'x' or 'x-x' or 'x-x-x'
          if (/^-/.test(item.index)) {
            item.index = item.index.replace(/^-/, '');
          }

          if (item.children) {
              formateDirTree(item, item.index);
          }

      });

    };

    formateDirTree(dirTree, '');

    return dirTree;
};

// get files map: {'/xx/xx..': {...}}
const getFilesMapByDirTree = (dirTree) => {

    const filesMap = {};

    const act = (tree) => {

      tree.children.forEach((item, index) => {

          filesMap[item.path] = item;

          if (item.children) {
              act(item, item.index);
          }

      });

  };

  act(dirTree);

  return filesMap;
};

// create shown-docs in src for sources to load
const createShownDocs = (docName, filesMap) => {

  for (let relativeFilePath in filesMap) {

      const filesMapItem = filesMap[relativeFilePath];

      const filename = path.basename(relativeFilePath);
      const foldername = path.dirname(relativeFilePath);
      const md5String = filesMapItem.md5String;

      // format 'x-x-x' to '[x, x, x]'
      const fileIndex = JSON.stringify(filesMapItem.index.split('-')).replace(/\"/g, "'");

      // create shown files
      const shownFilePath = path.join(srcFolder, docName, 'shown-docs', md5String + '.vue');

      let content = '';

      // 根据 doc 文件类型的不同，生成不同的显示模板

      // 如果是文件类型
      if (!fs.statSync(filesMapItem.absolutePath).isDirectory()) {
        content = `
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

          import Doc from '${filesMapItem.absolutePath}';

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

      // 如果是目录
      } else {
        content = `
          <template>
              <div class="hoper-body">

                  <div class="hoper-content">
                      <Mmenu :currentIndex="${fileIndex}"></Mmenu>
                      <div class="hoper-doc">
                      </div>
                  </div>

              </div>
          </template>

          <script>
          import Mheader from '../../components/Header.vue';
          import Mfooter from '../../components/Footer.vue';
          import Mmenu from '../components/Menu.vue';

          export default {
              components: {
                  Mheader,
                  Mfooter,
                  Mmenu,
              }
          };

          </script>
        `;
      }

      fse.ensureFileSync(shownFilePath);
      const fd = fs.openSync(shownFilePath, 'w+');
      fs.writeFileSync(shownFilePath, content);

      // prevent multi callback in webpack
      utime(shownFilePath);
      fs.close(fd);
  }
};

// create file-tree.js
const createFileTreeJsFile = (docName, dirTree) => {

    const dirTreeFilePath = path.join(path.join(srcFolder, docName, '/shown-docs/file-tree.js'));
    fse.ensureFileSync(dirTreeFilePath);
    const fd = fs.openSync(dirTreeFilePath, 'w');

    const contentStr = JSON.stringify(dirTree);

    fs.writeFileSync(dirTreeFilePath, `module.exports=${contentStr}`);
    fs.utimesSync(dirTreeFilePath, ((Date.now() - 10 * 1000)) / 1000, (Date.now() - 10 * 1000) / 1000);
    fs.close(fd);
};

// create vue routes
const createRoutesFile = (docName, filesMap) => {
    // 创建 routes.js
    const routesFilePath = path.join(srcFolder, docName, '/shown-docs/routes.js');
    let routesContent = ``;
    for (relativeFilePath in filesMap) {
        routesContent += `\nimport ${'doc_' + filesMap[relativeFilePath].md5String} from './${filesMap[relativeFilePath].md5String}.vue';`;
    }

    routesContent += `\n\nmodule.exports = [\n`;
    for (relativeFilePath in filesMap) {
        routesContent += `{
          path: '${filesMap[relativeFilePath].path}',
          component: ${'doc_' + filesMap[relativeFilePath].md5String}
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

const getFilesData = (docFolder, docName) => {
  const currentDocFolder = path.join(docFolder, docName);
  const relativeDocFilePath = getRelativeDocFilePath(currentDocFolder);
  const dirTree = getFormatedDirTree(currentDocFolder);
  const filesMap = getFilesMapByDirTree(dirTree);
};

const clearSrcFolder = () => {
    const srcFiles = fs.readdirSync(srcFolder);

    srcFiles.forEach((filename) => {
       if (!/(components)|(libs)/.test(filename)) {
         try {
           fse.removeSync(path.join(srcFolder, filename));
         } catch(err) {

         }
       }
    });
};

const prepareSrcFolder = () => {
    fs.readdirSync(docFolder).forEach((docName) => {

        createPageFromDemo(docName);

        const dirTree = getFormatedDirTree(path.join(docFolder, docName));
        const filesMap = getFilesMapByDirTree(dirTree);

        createShownDocs(docName, filesMap);
        createRoutesFile(docName, filesMap);
        createFileTreeJsFile(docName, dirTree);

        replaceKeywords(docName, 'is-dev');
    });
};

gulp.task('dev', () => {

    clearSrcFolder();
    prepareSrcFolder();
    emptyBuildFolder();
    createHtmlInBuildFolder();

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

    const WebpackDevServer = require('webpack-dev-server');
    const port = 9000;

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

    clearSrcFolder();
    prepareSrcFolder();
    emptyBuildFolder();
    createHtmlInBuildFolder();

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

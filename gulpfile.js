
const path = require('path');
const fs = require('fs');
const webpack = require('webpack');
const gulp = require('gulp');
const gulpWatch = require('gulp-watch');
const fse = require('fs-extra');
const md5 = require('md5');

const relative = require('relative');

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
const buildFolder = path.join(__dirname, '../vue-markdown-book-ghpages');
const docFolder = path.join(__dirname, 'docs');
const templateFolder = path.join(__dirname, 'template');

const excludeFilesRegExp = /(\.idea)|(\.ds_store)|(node\_modules)|(package\.json)|(package-lock)|(\.git)/i;
const shouldNotRemovedFilesRegExp = /(\.idea)|(\.DS_Store)|(\.git)/i;

const utime = (filePath) => {
  fs.utimesSync(filePath, ((Date.now() - 10 * 1000)) / 1000, (Date.now() - 10 * 1000) / 1000);
};

const emptyBuildFolder = () => {
    fse.ensureDirSync(buildFolder);
    fs.readdirSync(buildFolder).forEach((filename) => {
      if (!shouldNotRemovedFilesRegExp.test(filename)) {
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

                const filePath = path.join(srcFolder, foldername, subname);
                const subStats = fs.statSync(filePath);

                if (subStats.isFile() && /\.html$/.test(filePath) && !excludeFilesRegExp.test(filePath)) {
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

const replaceHtmlKeywords = (docName, currentEnv) => {
    const targetFolder = path.join(srcFolder, docName);
    const htmlPath = path.join(targetFolder, 'index.html');
    const fd = fs.openSync(htmlPath, 'r');
    const newHtmlContent = fs.readFileSync(htmlPath)
                              .toString()
                              .replace(/\$\$\_DOCNAME\_\$\$/g, docName)
                              .replace(/\$\$\_CDNURL\_\$\$/g, currentEnv === 'is-build' ? './static' : './website/static');
    fs.writeFileSync(htmlPath, newHtmlContent);
    fs.close(fd);

    readdirSync(targetFolder).forEach((filePath) => {
      utime(filePath);
    });
};

const createPageFromDemo = (docName) => {
  const targetFolder = path.join(srcFolder, docName);
  if (fs.existsSync(targetFolder)) {
    fse.removeSync(targetFolder);
  }
  fse.copySync(path.join(templateFolder, 'page-demo'), targetFolder);

  readdirSync(targetFolder).forEach((filePath) => {
    utime(filePath);
  });

};

// get dir tree
const getFormatedDirTree = (currentDocFolder) => {

    const filteredDirTree = {};

    // get dir tree
    const dirTree = readdirTree(currentDocFolder);

    // format dir tree path
    const formateDirTree = (tree, fileIndex) => {

      if (!tree.children) {
          return;
      }

      tree.children.forEach((item, index) => {

          // format into relative path
          item.path = item.path.replace(currentDocFolder, '');
          tree.path = tree.path.replace(currentDocFolder, '');

          // should be exluded
          if (excludeFilesRegExp.test(item.path)) {
              item.shouldNotShow = true;
          }
          if (excludeFilesRegExp.test(tree.path)) {
              tree.shouldNotShow = true;
          }

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

      if (!tree.children) {
          return;
      }
      tree.children.forEach((item, index) => {

          if (!item.shouldNotShow) {
              filesMap[item.path] = item;
          }

          if (item.children) {
              act(item, item.index);
          }

      });

  };

  act(dirTree);

  return filesMap;
};

const createShownVueFile = (relativeDocFilePath, filesMap, docName) => {
    const filesMapItem = filesMap[relativeDocFilePath];

    const filename = path.basename(relativeDocFilePath);
    const foldername = path.dirname(relativeDocFilePath);
    const md5String = filesMapItem.md5String;

    // format 'x-x-x' to '[x, x, x]'
    const fileIndex = JSON.stringify(filesMapItem.index.split('-')).replace(/\"/g, "'");

    // create shown files
    const shownVueFolder = path.join(srcFolder, docName, 'shown-vue');
    const shownFilePath = path.join(shownVueFolder, md5String + '.vue');

    let shownVueContent = '';

    const isFile = !fs.statSync(filesMapItem.absolutePath).isDirectory();

    // 如果是文件类型
    if (isFile) {

      let absoluteLoadedFilePath = filesMapItem.absolutePath;

      // create doc files that can be loaded.
      if (/\.((jpg)|(png)|(gif))$/.test(absoluteLoadedFilePath)) {

          absoluteLoadedFilePath = path.join(shownVueFolder, 'loaded-doc', relativeDocFilePath);

          absoluteLoadedFilePath += '.md';

          fse.ensureFileSync(absoluteLoadedFilePath);
          const fd = fs.openSync(absoluteLoadedFilePath, 'w+');

          const content = `![img](${relative(absoluteLoadedFilePath, filesMapItem.absolutePath)}) \n<style scoped>p {text-align: center;}</style>`;

          fs.writeFileSync(absoluteLoadedFilePath, content);
          fs.close(fd);
      } else if (!/\.md$/.test(absoluteLoadedFilePath)) {

          absoluteLoadedFilePath = path.join(shownVueFolder, 'loaded-doc', relativeDocFilePath);
          absoluteLoadedFilePath += '.md';

          const content = fs.readFileSync(filesMapItem.absolutePath).toString();

          fse.ensureFileSync(absoluteLoadedFilePath);
          const fd = fs.openSync(absoluteLoadedFilePath, 'w+');
          fs.writeFileSync(absoluteLoadedFilePath, '```\n' + content + (/\n$/.test(content) ? '```' :'\n```'));
          fs.close(fd);

      }

      shownVueContent = `
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

          import Doc from './${relative(shownFilePath, absoluteLoadedFilePath)}';

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
      shownVueContent = `
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
    fs.writeFileSync(shownFilePath, shownVueContent);

    // prevent multi callback in webpack
    utime(shownFilePath);
    fs.close(fd);
};

// create shown-vue in src for sources to load
const createShownVue = (docName, filesMap) => {

  for (let relativeDocFilePath in filesMap) {
      createShownVueFile(relativeDocFilePath, filesMap, docName);
  }

};

// create file-tree.js
const createFileTreeJsFile = (docName, dirTree) => {

    const dirTreeFilePath = path.join(path.join(srcFolder, docName, '/shown-vue/file-tree.js'));
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
    const routesFilePath = path.join(srcFolder, docName, '/shown-vue/routes.js');
    let routesContent = ``;
    for (relativeDocFilePath in filesMap) {
        routesContent += `\nimport ${'doc_' + filesMap[relativeDocFilePath].md5String} from './${filesMap[relativeDocFilePath].md5String}.vue';`;
    }

    routesContent += `\n\nmodule.exports = [\n`;
    for (relativeDocFilePath in filesMap) {
        routesContent += `{
          path: '${filesMap[relativeDocFilePath].path}',
          component: ${'doc_' + filesMap[relativeDocFilePath].md5String}
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

const prepareSrcFolder = (envString) => {
    fs.readdirSync(docFolder).forEach((docName) => {

        if (excludeFilesRegExp.test(docName)) {
            return;
        }

        createPageFromDemo(docName);

        const dirTree = getFormatedDirTree(path.join(docFolder, docName));
        const filesMap = getFilesMapByDirTree(dirTree);
        createShownVue(docName, filesMap);
        createRoutesFile(docName, filesMap);
        createFileTreeJsFile(docName, dirTree);

        replaceHtmlKeywords(docName, envString);

    });
};

gulp.task('dev', () => {

    clearSrcFolder();
    prepareSrcFolder('is-dev');
    emptyBuildFolder();
    createHtmlInBuildFolder();

    gulpWatch([path.join(docFolder, '**/*')], (stats) => {
        const filePath = stats.path;
        const docName = filePath.replace(docFolder, '').replace(/^\./, '').replace(/^\//, '').split('/').shift();
        const relativeDocFilePath = filePath.replace(docFolder, '').replace(/^\./, '').replace(/^\//, '').replace(docName, '');

        const dirTree = getFormatedDirTree(path.join(docFolder, docName));
        const filesMap = getFilesMapByDirTree(dirTree);

        switch(stats.event) {
            case 'change':
              createShownVueFile(relativeDocFilePath, filesMap, docName);
              break;
            case 'add':
              createShownVue(docName, filesMap);
              createRoutesFile(docName, filesMap);
              createFileTreeJsFile(docName, dirTree);
              break;
            case 'unlink':
              createShownVue(docName, filesMap);
              createRoutesFile(docName, filesMap);
              createFileTreeJsFile(docName, dirTree);
              break;
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
    prepareSrcFolder('is-build');
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

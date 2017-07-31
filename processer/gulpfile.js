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

function processer(context) {

    // can be replaced
    const srcDocFolder = context.srcDocFolder;
    let buildFolder = context.buildFolder;

    const srcCodeFolder = path.join(__dirname, 'src');

    const shouldNotCreatePagesReg = /(\/build\/)|(\.idea)|(\.ds_store)|(node\_modules)|(package\.json)|(package-lock)|(\.git)|(doc\-theme)/i;
    const shouldNotShowReg = /(\/build\/)|(\.idea)|(\.ds_store)|(node\_modules)|(package\.json)|(package-lock)|(\.git)|(doc\-theme)/i;
    const shouldNotRemovedFilesRegExp = /(\.idea)|(\.DS_Store)|(\.git)/i;

    const defaultUserConfig = {
        themeName: 'default',
        ignored: null
    };

    const watchList = {};

    const getConfigInFolder = (folder) => {

        // merge user config
        const userConfigFilePath = path.join(folder, './book.config.js');

        if (!fs.existsSync(userConfigFilePath)) {
            return null;
        }

        // set default
        const config = {
            themeName: 'default',
            ignored: null
        };

        const userConfig = require(userConfigFilePath)();

        if (userConfig) {

            if (userConfig.theme) {
                config.themeName = userConfig.theme;
            }

            if (userConfig.buildFolder) {
                config.buildFolder = userConfig.buildFolder;
            }

            if (userConfig.ignored) {
                config.ignored = userConfig.ignored;
            }
        }

        return config;
    };

    const getFinalConfig = (docName) => {
        const globalUserConfig = getConfigInFolder(__dirname);
        const currentDocUserConfig = getConfigInFolder(path.join(srcDocFolder, docName));

        let config = defaultUserConfig;
        if (currentDocUserConfig) {
            for (let i in currentDocUserConfig) {
                config[i] = currentDocUserConfig[i];
            }
        } else if (globalUserConfig) {
            for (let i in globalUserConfig) {
                config[i] = globalUserConfig[i];
            }
        }

        return config;
    };

    const shouldNotShow = (filePath) => {

        if (shouldNotShowReg.test(filePath)) {
            return true;
        }

        // if (ignored && ignored.test(filePath)) {
        //     return true;
        // }

        return false;
    };

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

    const createHtmlInBuildFolder = (docInfo) => {

        let filename = docInfo.docName;

        // create *.html in build folder
        const stats = fs.statSync(path.join(srcCodeFolder, filename));

        // only working for .html file in folders
        if (stats.isDirectory()) {
            const foldername = filename;
            const subFiles = fs.readdirSync(path.join(srcCodeFolder, foldername));

            subFiles.forEach((subname) => {

                const filePath = path.join(srcCodeFolder, foldername, subname);
                const subStats = fs.statSync(filePath);

                if (subStats.isFile() && /\.html$/.test(filePath) && !shouldNotShow(filePath)) {
                    try {
                        fse.copySync(path.join(srcCodeFolder, foldername, subname), path.join(buildFolder, foldername + '.html'));
                    } catch(err) {
                        console.log('error: ', err, ' \n and subname is: ', subname);
                    }
                  }
            });
        }

    };

    const replaceHtmlKeywords = (docInfo, currentEnv) => {

        const docName = docInfo.docName;

        const targetFolder = path.join(srcCodeFolder, docName);
        const htmlPath = path.join(targetFolder, 'index.html');

        const newHtmlContent = fs.readFileSync(htmlPath)
                                  .toString()
                                  .replace(/\$\$\_DOCNAME\_\$\$/g, docName)
                                  .replace(/\$\$\_CDNURL\_\$\$/g, currentEnv === 'is-build' ? './static' : './website/static');

        writeFileSync(htmlPath, newHtmlContent);

        readdirSync(targetFolder).forEach((filePath) => {
          utime(filePath);
        });
    };

    const createPageFromDemo = (docInfo) => {

        const docName = docInfo.docName;
        const themeFolder = docInfo.themeFolder;
        const targetFolder = path.join(srcCodeFolder, docName);
        if (fs.existsSync(targetFolder)) {
          fse.removeSync(targetFolder);
        }

        fs.readdirSync(themeFolder).forEach((filename) => {
            if (filename === 'routes-template') {
                return;
            }

            fse.copySync(path.join(themeFolder, filename), path.join(targetFolder, filename));
        });

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

          if (!tree || !tree.children) {
              return;
          }

          tree.children.forEach((item, index) => {

              // format into relative path
              item.path = item.path.replace(currentDocFolder, '');
              tree.path = tree.path.replace(currentDocFolder, '');

              // should be exluded
              if (shouldNotShow(item.path)) {
                  item.shouldNotShow = true;
              }
              if (shouldNotShow(tree.path)) {
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

              // item routerPath
              item.routerPath = item.path.replace(/\.md$/, '');

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

    const writeFileSync = (filePath, content) => {

        let mode = 'w';

        if (fs.existsSync(filePath)) {
            mode = 'r';
        }

        const fd = fs.openSync(filePath, mode);
        fs.writeFileSync(filePath, content);
        fs.close(fd);
        utime(filePath);
    };

    const createIframeFile = (filePath) => {
        fse.copySync(filePath, filePath + '.iframe-file.md');
    };

    const createIframeFileFromContent = (processedFilePath, originalFilePath) => {

        const fileContent = fs.readFileSync(processedFilePath).toString();
        const matchedArr = fileContent.match(/\<iframe\-doc[\s\S]+?\<\/iframe\-doc\>/g);

        if (!matchedArr || !matchedArr.length) {
            return;
        }

        const processedFolderName = path.dirname(processedFilePath);
        const originalFolderName = path.dirname(originalFilePath);

        let replacedContent = fileContent;
        matchedArr.forEach((matchedItem) => {

            // get src path
            let src = matchedItem.match(/src=\"[\S]*?\"/);
            if (src) {
                // get the last one
                src = src.pop().replace(/^src=\"/, '').replace(/\"$/, '');
            } else {
                src = '';
            }

            // create iframe src file (relative file path)
            const srcFilePath = path.join(originalFolderName, src);
            let targetFilePath = '';

            if (!src) {
                console.log('iframe-doc "src" attribute should be a vue or md file');

                // replace iframe-doc to iframe
                const replaced = matchedItem
                                  .replace('<iframe-doc', '<iframe')
                                  .replace('</iframe-doc>', '</iframe>');

                while(replacedContent.indexOf(matchedItem) !== -1) {
                    replacedContent = replacedContent.replace(matchedItem, replaced);
                }

                // rewrite processedFilePath
                writeFileSync(processedFilePath, replacedContent);

                return;
            }

            if (/\.vue$/.test(src)) {
                targetFilePath = path.join(processedFolderName, src + '.iframe-file.md');
            } else if (/\.md$/.test(src)) {
                targetFilePath = path.join(processedFolderName, src + '.iframe-file.md');
            }

            const md5String = md5(targetFilePath);

            if (!fs.existsSync(targetFilePath)) {
                fse.copySync(srcFilePath, targetFilePath);

                // add into watch list
                watchList[srcFilePath] = {
                    target: targetFilePath
                }

            }

            // replace iframe-doc to iframe
            const replaced = matchedItem
                              .replace('<iframe-doc', '<iframe')
                              .replace('</iframe-doc>', '</iframe>')
                              .replace(src, `/vdian-iframe.html#/${md5String}`);

            while(replacedContent.indexOf(matchedItem) !== -1) {
                replacedContent = replacedContent.replace(matchedItem, replaced);
            }

            // rewrite processedFilePath
            writeFileSync(processedFilePath, replacedContent);

            // update iframe routes
            const iframeRouteFileInSrc = path.join(srcCodeFolder, 'vdian-iframe/routes.js');

            let content = fs.readFileSync(iframeRouteFileInSrc).toString();
            const loadedName = md5String + '.md';

            // write routes
            if (!/module\.exports/.test(content)) {
                content = `module.exports = [];`;
            }

            if (content.indexOf(md5String) === -1) {
                content = `import doc_${md5String} from '${relative(iframeRouteFileInSrc, targetFilePath)}';\n` + content;
                content = content.replace(
                  'module.exports = [',
                  `module.exports = [\n{\n  path: '/${md5String}',\n  component: doc_${md5String}\n},\n`
                );

                writeFileSync(iframeRouteFileInSrc, content);
            }
        });

    };

    // get files map: {'/xx/xx..': {...}}
    const getFilesMapByDirTree = (dirTree) => {

        const filesMap = {};

        const act = (tree) => {

          if (!tree || !tree.children) {
              return;
          }
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

    const createShownVueFile = (relativeDocFilePath, docInfo) => {
        const docName = docInfo.docName;
        const themeFolder = docInfo.themeFolder;
        const filesMap = docInfo.filesMap;

        const filesMapItem = filesMap[relativeDocFilePath];

        const filename = path.basename(relativeDocFilePath);
        const foldername = path.dirname(relativeDocFilePath);
        const md5String = filesMapItem.md5String;

        // format 'x-x-x' to '[x, x, x]'
        const fileIndex = JSON.stringify(filesMapItem.index.split('-')).replace(/\"/g, "'");

        // create shown files
        const shownVueFolder = path.join(srcCodeFolder, docName, 'routes');
        const shownFilePath = path.join(shownVueFolder, md5String + '.vue');

        const isFile = !fs.statSync(filesMapItem.absolutePath).isDirectory();

        const processedDocFolder = path.join(shownVueFolder, 'processed-doc');
        let absoluteLoadedFilePath = path.join(processedDocFolder, relativeDocFilePath);

        fse.copySync(filesMapItem.absolutePath, absoluteLoadedFilePath);

        // 如果是文件类型
        if (isFile) {

          // create doc files that can be loaded.
          if (/\.((jpg)|(png)|(gif))$/.test(absoluteLoadedFilePath)) {

              absoluteLoadedFilePath += '.md';
              fse.ensureFileSync(absoluteLoadedFilePath);
              const content = `![img](${relative(absoluteLoadedFilePath, filesMapItem.absolutePath)}) \n<style scoped>p {text-align: center;}</style>`;
              writeFileSync(absoluteLoadedFilePath, content);
          } else if (!/\.md$/.test(absoluteLoadedFilePath)) {

              const extname = path.extname(absoluteLoadedFilePath).replace('.', '');

              absoluteLoadedFilePath += '.md';

              const content = fs.readFileSync(filesMapItem.absolutePath).toString();

              fse.ensureFileSync(absoluteLoadedFilePath);
              writeFileSync(absoluteLoadedFilePath, '```' + extname + '\n' + content + (/\n$/.test(content) ? '```' :'\n```'));

          } else {
              createIframeFileFromContent(absoluteLoadedFilePath, filesMapItem.absolutePath);
          }

        }

        let shownVueContent = '';
        if (isFile) {
            const templateContent = fs.readFileSync(path.join(themeFolder, 'routes-template/file-template.vue')).toString();
            shownVueContent = templateContent.replace(/\$\$\_FILE\_INDEX\_\$\$/g, JSON.stringify(fileIndex))
                                             .replace(/\$\$\_DOC\_PATH\_\$\$/g, JSON.stringify('./' + relative(shownFilePath, absoluteLoadedFilePath)));
        } else {
          const templateContent = fs.readFileSync(path.join(themeFolder, 'routes-template/dir-template.vue')).toString();
          shownVueContent = templateContent.replace(/\$\$\_FILE\_INDEX\_\$\$/g, JSON.stringify(fileIndex));
        }

        fse.ensureFileSync(shownFilePath);

        writeFileSync(shownFilePath, shownVueContent);

    };

    // create shown-vue in src for sources to load
    const createShownVue = (docInfo) => {

      const filesMap = docInfo.filesMap;

      for (let relativeDocFilePath in filesMap) {
          createShownVueFile(relativeDocFilePath, docInfo);
      }

    };

    // create file-tree.js
    const createFileTreeJsFile = (docInfo) => {

        const docName = docInfo.docName;
        const dirTree = docInfo.dirTree;

        const dirTreeFilePath = path.join(path.join(srcCodeFolder, docName, 'file-tree.js'));
        fse.ensureFileSync(dirTreeFilePath);

        const contentStr = JSON.stringify(dirTree);

        writeFileSync(dirTreeFilePath, `module.exports=${contentStr}`);

    };

    // create vue routes
    const createRouteFiles = (docInfo) => {

        const docName = docInfo.docName;
        const filesMap = docInfo.filesMap;

        // 创建 routes.js
        const routesFilePath = path.join(srcCodeFolder, docName, 'routes.js');
        let routesContent = ``;
        for (relativeDocFilePath in filesMap) {
            routesContent += `\nimport ${'doc_' + filesMap[relativeDocFilePath].md5String} from './routes/${filesMap[relativeDocFilePath].md5String}.vue';`;
        }

        routesContent += `\n\nmodule.exports = [\n`;
        for (relativeDocFilePath in filesMap) {
            routesContent += `{
              path: '${filesMap[relativeDocFilePath].routerPath}',
              component: ${'doc_' + filesMap[relativeDocFilePath].md5String}
            },`;
        }
        routesContent = routesContent.replace(/\,$/, '');
        routesContent += '\n];';

        fse.ensureFileSync(routesFilePath);

        writeFileSync(routesFilePath, routesContent);
    };

    const getFilesData = (srcDocFolder, docName) => {
      const currentDocFolder = path.join(srcDocFolder, docName);
      const relativeDocFilePath = getRelativeDocFilePath(currentDocFolder);
      const dirTree = getFormatedDirTree(currentDocFolder);
      const filesMap = getFilesMapByDirTree(dirTree);
    };

    const clearSrcCodeFolder = () => {
        const srcFiles = fs.readdirSync(srcCodeFolder);

        srcFiles.forEach((filename) => {
           if (!/(components)|(libs)/.test(filename)) {
             try {
               fse.removeSync(path.join(srcCodeFolder, filename));
             } catch(err) {

             }
           }
        });
    };

    const handleByDocName = (docName, docMap, env) => {
        if (shouldNotCreatePagesReg.test(docName)) {
            return;
        }

        const config = getFinalConfig(docName);

        const dirTree = getFormatedDirTree(path.join(srcDocFolder, docName));
        const filesMap = getFilesMapByDirTree(dirTree);

        if (docName === 'vdian-iframe') {
            config.themeName = 'vdian-iframe';
        }

        docMap[docName] = {
            docName: docName,
            dirTree: dirTree,
            filesMap: filesMap,
            themeName: config.themeName,
            ignored: config.ignored,

            themeFolder: path.join(__dirname, 'theme', config.themeName)
        };

        createPageFromDemo(docMap[docName]);
        createShownVue(docMap[docName]);
        createRouteFiles(docMap[docName]);
        createFileTreeJsFile(docMap[docName]);
        replaceHtmlKeywords(docMap[docName], 'is-dev');
        createHtmlInBuildFolder(docMap[docName]);
    };

    const handlers = {};

    handlers['dev'] =

    handlers['dev'] = () => {

        clearSrcCodeFolder();
        emptyBuildFolder();

        const docMap = {};
        const docNames = fs.readdirSync(srcDocFolder);
        // prepare iframe things
        handleByDocName('vdian-iframe', docMap, 'is-dev');
        docNames.forEach((docName) => {
            handleByDocName(docName, docMap, 'is-dev');
        });

        gulpWatch([path.join(srcDocFolder, '**/*')], (stats) => {
            const filePath = stats.path;
            const docName = filePath.replace(srcDocFolder, '').replace(/^\./, '').replace(/^\//, '').split('/').shift();
            const relativeDocFilePath = filePath.replace(srcDocFolder, '').replace(/^\./, '').replace(/^\//, '').replace(docName, '');

            if (watchList[filePath]) {
                fse.copySync(filePath, watchList[filePath].target);
            }

            const dirTree = getFormatedDirTree(path.join(srcDocFolder, docName));
            const filesMap = getFilesMapByDirTree(dirTree);

            switch(stats.event) {
                case 'change':
                  createShownVueFile(relativeDocFilePath, docMap[docName]);
                  break;
                case 'add':
                  createShownVue(docMap[docName]);
                  createRouteFiles(docMap[docName]);
                  createFileTreeJsFile(docMap[docName]);
                  break;
                case 'unlink':
                  createShownVue(docMap[docName]);
                  createRouteFiles(docMap[docName]);
                  createFileTreeJsFile(docMap[docName]);
                  break;
            }

        });

        const WebpackDevServer = require('webpack-dev-server');

        // get default webpack config
        const webpackConfig = require('./webpack.config')(srcCodeFolder, buildFolder);

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
            webpackConfig.entry[i].unshift(`webpack-dev-server/client?http://127.0.0.1:${context.debugPort}`, 'webpack/hot/dev-server');
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

        server.listen(context.debugPort);

    };


    handlers['build'] = () => {

        clearSrcCodeFolder();
        emptyBuildFolder();

        fs.readdirSync(srcDocFolder).forEach((docName) => {

            if (shouldNotCreatePagesReg.test(docName)) {
                return;
            }

            const dirTree = getFormatedDirTree(path.join(srcDocFolder, docName));
            const filesMap = getFilesMapByDirTree(dirTree);
            createShownVue(docName, filesMap);
            createRouteFiles(docName, filesMap);
            createFileTreeJsFile(docName, dirTree);

            replaceHtmlKeywords(docName, 'is-build');

            createHtmlInBuildFolder(docName);

        });

        // get default webpack config
        const webpackConfig = require('./webpack.config')(srcCodeFolder, buildFolder);

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

        webpack(webpackConfig, () => {});

    };

    // run
    handlers[context.currentEnv]();

}

gulp.task('dev', () => {
    processer({
        srcDocFolder: path.join(__dirname, '../docs'),
        buildFolder: path.join(__dirname, '../docs/build'),
        debugPort: 9000,
        currentEnv: 'dev'
    });
});

gulp.task('build', () => {
    processer({
        srcDocFolder: path.join(__dirname, '../docs'),
        buildFolder: path.join(__dirname, '../build'),
        currentEnv: 'build'
    });
});

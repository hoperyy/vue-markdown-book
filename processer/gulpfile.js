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
    const rootDocFolder = context.rootDocFolder;
    let buildFolder = context.buildFolder;

    const codeFolder = path.join(__dirname, 'src');

    const shouldNotRemovedFilesReg = /(\.idea)|(\.DS_Store)|(\.git)/i;

    const defaultUserConfig = {
        theme: 'default',
        iframeTheme: 'iframe-default',

        _shouldNotCreatePagesReg: /\/((build)|(\.idea)|(\.ds_store)|(node\_modules)|(package\.json)|(package-lock)|(\.git)|(doc\-theme)|(bookconfig\.js))/i,
        _shouldNotShowReg: /\/((iframe\-demos)|(build)|(\.idea)|(\.ds_store)|(node\_modules)|(package\.json)|(package-lock)|(\.git)|(doc\-theme)|(bookconfig\.js)|(assets))/i,
        shouldNotShowExtnameReg: /\.((md))$/i
    };

    const docMap = {};

    const watchList = {};

    const getDocFolderWithDocName = (docName) => {
        return {
            docFolderWithDocName: path.join(rootDocFolder, docName),
            processedDocFolderWithDocName: path.join(codeFolder, docName, 'routes', 'processed-doc')
        };
    };

    const getConfigInFolder = (folder) => {

        // merge user config
        const userConfigFilePath = path.join(folder, './bookconfig.js');

        if (!fs.existsSync(userConfigFilePath)) {
            return null;
        }

        const userConfig = require(userConfigFilePath)();

        return userConfig;
    };

    const shouldNotShow = (filePath, config) => {

        if (!/^\//.test(filePath)) {
            filePath = '/' + filePath;
        }

        // default config
        if (config._shouldNotShowReg.test(filePath)) {
            return true;
        }

        // user config
        if (config.shouldNotShowReg && config.shouldNotShowReg.test(filePath)) {
            return true;
        }

        return false;
    };

    const utime = (filePath) => {
      fs.utimesSync(filePath, ((Date.now() - 10 * 1000)) / 1000, (Date.now() - 10 * 1000) / 1000);
    };

    const emptyBuildFolder = () => {
        fse.ensureDirSync(buildFolder);
        fs.readdirSync(buildFolder).forEach((filename) => {
          if (!shouldNotRemovedFilesReg.test('/' + filename + '/')) {
            try {
              fse.removeSync(path.join(buildFolder, filename));
            } catch(err) {

            }
          }
        });
    };

    const createHtmlInBuildFolder = (docName) => {

        let filename = docName;

        // create *.html in build folder
        const stats = fs.statSync(path.join(codeFolder, filename));

        // only working for .html file in folders
        if (stats.isDirectory()) {
            const foldername = filename;
            const subFiles = fs.readdirSync(path.join(codeFolder, foldername));

            subFiles.forEach((subname) => {

                const filePath = path.join(codeFolder, foldername, subname);
                const subStats = fs.statSync(filePath);

                if (subStats.isFile() && /\.html$/.test(filePath) && !shouldNotShow(filePath, docName)) {
                    try {
                        fse.copySync(path.join(codeFolder, foldername, subname), path.join(buildFolder, foldername + '.html'));
                    } catch(err) {
                        console.log('error: ', err, ' \n and subname is: ', subname);
                    }
                  }
            });
        }

    };

    const replaceHtmlKeywords = (targetFile, pageName, currentEnv) => {

        const htmlPath = targetFile;

        const newHtmlContent = fs.readFileSync(htmlPath)
                                  .toString()
                                  .replace(/\$\$\_DOCNAME\_\$\$/g, pageName)
                                  .replace(/\$\$\_CDNURL\_\$\$/g, currentEnv === 'is-build' ? './static' : './website/static');

        writeFileSync(htmlPath, newHtmlContent);
    };

    const copyPageFromThemeTemplate = (srcFolder, targetFolder) => {

        if (fs.existsSync(targetFolder)) {
            fse.removeSync(targetFolder);
        }

        fs.readdirSync(srcFolder).forEach((filename) => {
            if (filename === 'routes-template') {
                return;
            }

            fse.copySync(path.join(srcFolder, filename), path.join(targetFolder, filename));
        });

        readdirSync(targetFolder).forEach((filePath) => {
            utime(filePath);
        });

    };

    const copyIframeFromDemo = (docInfo) => {

        const docName = docInfo.docName;
        const iframeTheme = docInfo.iframeTheme;
        const themeTemplateFolder = docInfo.themeTemplateFolder;
        const iframeThemeTemplateFolder = docInfo.themeTemplateFolder;
        const targetFolder = path.join(codeFolder, docName);

        if (fs.existsSync(targetFolder)) {
          fse.removeSync(targetFolder);
        }

        fs.readdirSync(themeTemplateFolder).forEach((filename) => {
            if (filename === 'routes-template') {
                return;
            }

            fse.copySync(path.join(themeTemplateFolder, filename), path.join(targetFolder, filename));
        });

        // copy iframe template for this doc folder
        fs.readdirSync(iframeThemeTemplateFolder).forEach((filename) => {
            if (filename === 'routes-template') {
                return;
            }

            fse.copySync(path.join(iframeThemeTemplateFolder, filename), path.join(path.join(codeFolder, docInfo.md5IframeTheme), filename));
        });

        readdirSync(targetFolder).forEach((filePath) => {
            utime(filePath);
        });

    };

    // get dir tree
    const getFormatedDirTree = (docName, config) => {

        const currentDocFolder = path.join(rootDocFolder, docName);

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
              if (shouldNotShow(item.path, config)) {
                  item.shouldNotShow = true;
              }
              if (shouldNotShow(tree.path, config)) {
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
              item.routerPath = item.path.replace(config.shouldNotShowExtnameReg, '');

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

    const processIframeFromContent = (processedFilePath, originalFilePath, iframeName) => {

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

                utime(targetFilePath);

                // add into watch list
                watchList[srcFilePath] = {
                    target: targetFilePath
                }

            }

            // replace iframe-doc to iframe
            const replaced = matchedItem
                              .replace('<iframe-doc', '<iframe')
                              .replace('</iframe-doc>', '</iframe>')
                              .replace(src, `/${iframeName}.html#/${md5String}`);

            while(replacedContent.indexOf(matchedItem) !== -1) {
                replacedContent = replacedContent.replace(matchedItem, replaced);
            }

            // rewrite processedFilePath
            writeFileSync(processedFilePath, replacedContent);

            // update iframe routes
            const iframeRouteFileInSrc = path.join(codeFolder, `${iframeName}/routes.js`);

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

    const transforFilePath = (docName, relativeDocFilePath) => {

        const processedDocFolderWithDocName = getDocFolderWithDocName(docName).processedDocFolderWithDocName;
        const docFolderWithDocName = getDocFolderWithDocName(docName).docFolderWithDocName;

        const docFilePath = path.join(docFolderWithDocName, relativeDocFilePath);
        const copiedDocFilePath = path.join(processedDocFolderWithDocName, relativeDocFilePath);

        const isFile = true;//fs.statSync(docFilePath).isFile();

        let processedFilePath = copiedDocFilePath;

        let isImg = false;
        let isMd = false;

        if (isFile) {
            if (/\.((jpg)|(png)|(gif))$/.test(copiedDocFilePath)) {
                processedFilePath += '.md';
                isImg = true;
            } else if (!/\.md$/.test(copiedDocFilePath)) {
                processedFilePath += '.md';
                isMd = false;
            } else if (/\.md$/.test(copiedDocFilePath)) {
                isMd = true;
            }
        }

        return {
            processedFilePath: processedFilePath,
            docFilePath: docFilePath,
            copiedDocFilePath: copiedDocFilePath,
            isImg: isImg,
            isMd: isMd
        };
    };

    const copyDocFile = (docName, relativeDocFilePath) => {

        const docNameInfo = docMap[docName];
        const iframeTheme = docNameInfo.iframeTheme;

        const transforedFilePath = transforFilePath(docName, relativeDocFilePath);
        const docFilePath = transforedFilePath.docFilePath;
        const copiedDocFilePath = transforedFilePath.copiedDocFilePath;
        const processedFilePath = transforedFilePath.processedFilePath;

        fse.copySync(docFilePath, copiedDocFilePath);

        utime(copiedDocFilePath);

        // step: create new file in src/** by file type
        if (fs.statSync(docFilePath).isFile()) {

            if (transforedFilePath.isImg) {
                fse.ensureFileSync(copiedDocFilePath);
                const content = `![img](${relative(copiedDocFilePath, docFilePath)}) \n<style scoped>p {text-align: center;}</style>`;
                writeFileSync(processedFilePath, content);
            } else if (!transforedFilePath.isMd) {
                const extname = path.extname(copiedDocFilePath).replace('.', '');
                const content = fs.readFileSync(docFilePath).toString();
                fse.ensureFileSync(processedFilePath);
                writeFileSync(processedFilePath, '```' + extname + '\n' + content + (/\n$/.test(content) ? '```' :'\n```'));
            } else if (transforedFilePath.isMd) {
                processIframeFromContent(copiedDocFilePath, docFilePath, docNameInfo.md5IframeTheme);
            }
        }

        return processedFilePath;

    };

    const createShownVueFile = (docName, relativeDocFilePath) => {

        const docInfo = docMap[docName];

        const transforedFilePath = transforFilePath(docInfo.docName, relativeDocFilePath);
        const processedFilePath = transforedFilePath.processedFilePath;

        const filesMapItem = docInfo.filesMap[relativeDocFilePath];

        // create shown vue pages
        const shownFilePath = path.join(codeFolder, docInfo.docName, 'routes', filesMapItem.md5String + '.vue');

        // format 'x-x-x' to '[x, x, x]'
        const fileIndex = JSON.stringify(filesMapItem.index.split('-')).replace(/\"/g, "'");

        let shownVueContent = '';
        if (fs.statSync(transforedFilePath.docFilePath).isFile()) {
            const templateContent = fs.readFileSync(path.join(docInfo.themeTemplateFolder, 'routes-template/file-template.vue')).toString();
            shownVueContent = templateContent.replace(/\$\$\_FILE\_INDEX\_\$\$/g, JSON.stringify(fileIndex))
                                             .replace(/\$\$\_DOC\_PATH\_\$\$/g, JSON.stringify('./' + relative(shownFilePath, processedFilePath)));
        } else {
            const templateContent = fs.readFileSync(path.join(docInfo.themeTemplateFolder, 'routes-template/dir-template.vue')).toString();
            shownVueContent = templateContent.replace(/\$\$\_FILE\_INDEX\_\$\$/g, JSON.stringify(fileIndex));
        }

        fse.ensureFileSync(shownFilePath);

        writeFileSync(shownFilePath, shownVueContent);

    };

    const removeShownVueFile = (relativeDocFilePath, docInfo) => {

        const filesMapItem = docInfo.filesMap[relativeDocFilePath];
        const shownFilePath = path.join(codeFolder, docInfo.docName, 'routes', filesMapItem.md5String + '.vue');

        fse.removeSync(shownFilePath);

    };

    const removeDocFile = (relativeDocFilePath, docInfo) => {

        const transforedFilePath = transforFilePath(docInfo.docName, relativeDocFilePath);

        const copiedDocFilePath = transforedFilePath.copiedDocFilePath;
        const processedFilePath = transforedFilePath.processedFilePath;

        fse.removeSync(copiedDocFilePath);
        fse.removeSync(processedFilePath);
    };

    // create shown-vue in src for sources to load
    const createShownVue = (docName) => {

      const docInfo = docMap[docName];

      const filesMap = docInfo.filesMap;

      for (let relativeDocFilePath in filesMap) {
          copyDocFile(docInfo, relativeDocFilePath);
          createShownVueFile(docName, relativeDocFilePath);
      }

    };

    // create file-tree.js
    const writeFileTreeJsFile = (docName, targetFile) => {

        const docInfo = docMap[docName];
        const dirTree = docInfo.dirTree;

        fse.ensureFileSync(targetFile);
        const contentStr = JSON.stringify(dirTree);
        writeFileSync(targetFile, `module.exports=${contentStr}`);
    };

    // create vue routes
    const writeRouteFile = (docName, targetRouteFile) => {

        const docInfo = docMap[docName];
        const filesMap = docInfo.filesMap;

        // 创建 routes.js
        const routesFilePath = targetRouteFile;
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

    const clearSrcCodeFolder = () => {
        const srcFiles = fs.readdirSync(codeFolder);

        srcFiles.forEach((filename) => {
           if (!/(components)|(libs)/.test(filename)) {
             try {
               fse.removeSync(path.join(codeFolder, filename));
             } catch(err) {

             }
           }
        });
    };

    const getFinalConfigByDocName = (docName) => {

        const globalUserConfig = getConfigInFolder(rootDocFolder);
        const currentDocUserConfig = getConfigInFolder(path.join(rootDocFolder, docName));

        let config = {};

        for (let i in defaultUserConfig) {
            config[i] = defaultUserConfig[i];
        }

        if (globalUserConfig) {
            for (let i in globalUserConfig) {
                config[i] = globalUserConfig[i];
            }
        }

        if (currentDocUserConfig) {
            for (let i in currentDocUserConfig) {
                config[i] = currentDocUserConfig[i];
            }
        }

        return config;
    };

    const getDocInfoByDocName = (docName) => {
        const config = getFinalConfigByDocName(docName);

        const dirTree = getFormatedDirTree(docName, config);
        const filesMap = getFilesMapByDirTree(dirTree);

        const finalConfig = {
            docName: docName,

            dirTree: dirTree,
            filesMap: filesMap,

            docFolderWithDocName: path.join(rootDocFolder, docName),
            processedDocFolderWithDocName: path.join(codeFolder, docName, 'routes', 'processed-doc'),

            theme: config.theme,
            iframeTheme: config.iframeTheme,
            md5IframeTheme: md5(docName + '-' + config.iframeTheme),

            themeTemplateFolder: path.join(__dirname, 'theme', config.theme),
            iframeThemeTemplateFolder: path.join(__dirname, 'theme', config.theme)
        };

        for (let i in config) {
            finalConfig[i] = config[i];
        }

        return finalConfig;
    };

    const handlers = {};

    handlers['dev'] = () => {

        clearSrcCodeFolder();
        emptyBuildFolder();

        const docNames = fs.readdirSync(rootDocFolder);

        docNames.forEach((docName) => {
            const userConfig = getFinalConfigByDocName(docName);

            // default config
            if (userConfig._shouldNotCreatePagesReg.test('/' + docName + '/')) {
                return;
            }

            // user config
            if (userConfig.shouldNotCreatePagesReg && userConfig.shouldNotCreatePagesReg.test('/' + docName + '/')) {
                return;
            }

            const docNameInfo = getDocInfoByDocName(docName);

            docMap[docName] = docNameInfo;

            // create pages
            copyPageFromThemeTemplate(docNameInfo.themeTemplateFolder, path.join(codeFolder, docName));

            // copy iframe defined in doc
            copyPageFromThemeTemplate(path.join(__dirname, 'theme', docNameInfo.iframeTheme), path.join(codeFolder, docNameInfo.md5IframeTheme));

            for (let relativeDocFilePath in docNameInfo.filesMap) {

                // copy doc file
                copyDocFile(docName, relativeDocFilePath);

                // create shown vue file
                createShownVueFile(docName, relativeDocFilePath);

            }

            // write route file
            writeRouteFile(docName, path.join(codeFolder, docName, 'routes.js'));

            // write filetree.js
            writeFileTreeJsFile(docName, path.join(path.join(codeFolder, docName, 'file-tree.js')));

            replaceHtmlKeywords(path.join(codeFolder, docName, 'index.html'), docName, 'is-dev');
            replaceHtmlKeywords(path.join(codeFolder, docNameInfo.md5IframeTheme, 'index.html'), docNameInfo.md5IframeTheme, 'is-dev');

            fse.copySync(path.join(codeFolder, docName, 'index.html'), path.join(buildFolder, docName + '.html'));
            fse.copySync(path.join(codeFolder, docNameInfo.md5IframeTheme, 'index.html'), path.join(buildFolder, docNameInfo.md5IframeTheme + '.html'));

            utime(path.join(buildFolder, docName + '.html'));
            utime(path.join(buildFolder, docNameInfo.md5IframeTheme + '.html'));
        });

        gulpWatch([path.join(rootDocFolder, '**/*')], (stats) => {
            const filePath = stats.path;
            const docName = filePath.replace(rootDocFolder, '').replace(/^\./, '').replace(/^\//, '').split('/').shift();

            const userConfig = getFinalConfigByDocName(docName);

            // default config
            if (userConfig._shouldNotCreatePagesReg.test('/' + docName + '/')) {
                return;
            }

            // user config
            if (userConfig.shouldNotCreatePagesReg && userConfig.shouldNotCreatePagesReg.test('/' + docName + '/')) {
                return;
            }

            const relativeDocFilePath = filePath.replace(rootDocFolder, '').replace(/^\./, '').replace(/^\//, '').replace(docName, '');

            if (watchList[filePath]) {
                fse.copySync(filePath, watchList[filePath].target);
            }

            let docNameInfo = getDocInfoByDocName(docName);

            switch(stats.event) {
                case 'change':
                    copyDocFile(docName, relativeDocFilePath);
                    break;
                case 'add':

                    // reget dir tree and filesMap
                    docNameInfo = getDocInfoByDocName(docName);

                    // copy doc file
                    copyDocFile(docName, relativeDocFilePath);

                    // create shown vue file
                    createShownVueFile(docName, relativeDocFilePath);

                    // write route file
                    writeRouteFile(docName, path.join(codeFolder, docName, 'routes.js'));

                    // write filetree.js
                    writeFileTreeJsFile(docName, path.join(path.join(codeFolder, docName, 'file-tree.js')));
                    break;
                case 'unlink':

                    // reget dir tree and filesMap
                    docNameInfo = getDocInfoByDocName(docName);

                    // write route file
                    writeRouteFile(docName, path.join(codeFolder, docName, 'routes.js'));

                    // write filetree.js
                    writeFileTreeJsFile(docName, path.join(path.join(codeFolder, docName, 'file-tree.js')));

                    // const lastDocNameInfo = docMap[docName];
                    // removeShownVueFile(relativeDocFilePath, lastDocNameInfo);
                    // removeDocFile(relativeDocFilePath, lastDocNameInfo);
                    break;
            }

        });

        const WebpackDevServer = require('webpack-dev-server');

        // get default webpack config
        const webpackConfig = require('./webpack.config')(rootDocFolder, codeFolder, buildFolder);

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

        console.log('webpack compiling...');
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

        const docNames = fs.readdirSync(rootDocFolder);

        docNames.forEach((docName) => {
            if (_shouldNotCreatePagesReg.test('/' + docName + '/')) {
                return;
            }

            docMap[docName] = getDocInfoByDocName(docName);

            const docNameInfo = docMap[docName];

            // create pages
            copyPageFromThemeTemplate(docNameInfo.themeTemplateFolder, path.join(codeFolder, docName));

            // copy iframe defined in doc
            copyPageFromThemeTemplate(path.join(__dirname, 'theme', docNameInfo.iframeTheme), path.join(codeFolder, docNameInfo.md5IframeTheme));

            for (let relativeDocFilePath in docNameInfo.filesMap) {

                // copy doc file
                copyDocFile(docName, relativeDocFilePath);

                // create shown vue file
                createShownVueFile(docName, relativeDocFilePath);

            }

            // write route file
            writeRouteFile(docName, path.join(codeFolder, docName, 'routes.js'));

            // write filetree.js
            writeFileTreeJsFile(docName, path.join(path.join(codeFolder, docName, 'file-tree.js')));

            replaceHtmlKeywords(path.join(codeFolder, docName, 'index.html'), docName, 'is-dev');
            replaceHtmlKeywords(path.join(codeFolder, docNameInfo.md5IframeTheme, 'index.html'), docNameInfo.md5IframeTheme, 'is-build');

            fse.copySync(path.join(codeFolder, docName, 'index.html'), path.join(buildFolder, docName + '.html'));
            fse.copySync(path.join(codeFolder, docNameInfo.md5IframeTheme, 'index.html'), path.join(buildFolder, docNameInfo.md5IframeTheme + '.html'));

            utime(path.join(buildFolder, docName + '.html'));
            utime(path.join(buildFolder, docNameInfo.md5IframeTheme + '.html'));
        });

        // get default webpack config
        const webpackConfig = require('./webpack.config')(codeFolder, buildFolder);

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
        rootDocFolder: path.join(__dirname, '../docs'),
        buildFolder: path.join(__dirname, '../docs/build'),
        debugPort: 9000,
        currentEnv: 'dev'
    });
});

gulp.task('build', () => {
    processer({
        rootDocFolder: path.join(__dirname, '../docs'),
        buildFolder: path.join(__dirname, '../build'),
        currentEnv: 'build'
    });
});

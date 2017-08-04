const path = require('path');
const fs = require('fs');
const webpack = require('webpack');
const gulp = require('gulp');
const gulpWatch = require('gulp-watch');
const fse = require('fs-extra');
const md5 = require('md5');
const relative = require('relative');
const git = require('git-rev-sync');

const StringReplacePlugin = require('string-replace-webpack-plugin');

const readdirTree = require('directory-tree');
const readdirEnhanced = require('readdir-enhanced').sync;
const readdirSync = (dir) => {
    return readdirEnhanced(dir, {
        deep: true,
        basePath: dir
    });
};

// 针对微店发布系统订制的方法，获取版本号
const getGitVersion = () => {

    try {
        let version = git.branch($srcFolder);
        version = version.indexOf('publish/') > -1 ? version.replace(/publish\//,'') : '0.0.0';
        return version;
    } catch(err) {

        // 不报错
        return '0.0.0';
    }

}

// not working now, to be fixed
function getStringReplaceLoader(replaceMap, currentEnv){

    const replacements = [];

    for(let key in replaceMap){

        replacements.push({
            pattern: new RegExp(key.replace(/\$/g, '\\$'), 'g'),
            replacement() {
                return replaceMap[key][currentEnv];
            }
        });
    }

    return {
        test: /\.((vue)|(vuex)|(js)|(jsx)|(html)|(md))$/,
        exclude: /(node_modules|bower_components)/,
        loader: StringReplacePlugin.replace({
            replacements: replacements
        })
    };
}

// replace
const getReplaceMap = () => {

    const gitVersion = getGitVersion();

    const keyWords = {
        '$$_CDNURL_$$': {
            'dev-daily': './website/static',
            'dev-pre': './website/static',
            'dev-prod': './website/static',
            'build-daily': './static',
            'build-daily': './static',
            'build-daily': './static'
        }
    };

    return keyWords;
};

const globalReplaceMap = getReplaceMap();

function processer(context) {

    const globalCurrentEnv = context.currentEnv;

    // can be replaced
    const globalDocFolder = context.docFolder;
    let globalBuildFolder = context.buildFolder;

    const globalCodeFolder = path.join(__dirname, 'src');

    const globalShouldNotRemovedFilesReg = /(\.idea)|(\.DS_Store)|(\.git)/i;

    const defaultUserConfig = {
        theme: 'default',
        iframeTheme: 'iframe-default',

        _shouldNotCreatePagesReg: /\/((book\-themes)|(build)|(\.idea)|(\.ds_store)|(node\_modules)|(package\.json)|(package-lock)|(\.git)|(doc\-theme)|(bookconfig\.js))/i,
        _shouldNotShowReg: /\/((book\-themes)|(iframe\-demos)|(build)|(\.idea)|(\.ds_store)|(node\_modules)|(package\.json)|(package-lock)|(\.git)|(doc\-theme)|(bookconfig\.js)|(assets))/i,
        shouldNotShowExtnameReg: /\.((md))$/i
    };

    const docMap = {};

    const watchList = {};

    const getDocFolderWithDocName = (docName) => {
        return {
            docFolderWithDocName: path.join(globalDocFolder, docName),
            processedDocFolderWithDocName: path.join(globalCodeFolder, docName, 'routes', 'processed-doc')
        };
    };

    const getConfigInFolder = (folder) => {

        // merge user config
        const userConfigFilePath = path.join(folder, './bookconfig.js');

        if (!fs.existsSync(userConfigFilePath)) {
            return null;
        }

        const config = require(userConfigFilePath);

        let userConfig;

        if (typeof config === 'function') {
            userConfig = config();
        } else {
            userConfig = config;
        }

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
        fse.ensureDirSync(globalBuildFolder);
        fs.readdirSync(globalBuildFolder).forEach((filename) => {
          if (!globalShouldNotRemovedFilesReg.test('/' + filename + '/')) {
            try {
              fse.removeSync(path.join(globalBuildFolder, filename));
            } catch(err) {

            }
          }
        });
    };

    const createHtmlInBuildFolder = (docName) => {

        let filename = docName;

        // create *.html in build folder
        const stats = fs.statSync(path.join(globalCodeFolder, filename));

        // only working for .html file in folders
        if (stats.isDirectory()) {
            const foldername = filename;
            const subFiles = fs.readdirSync(path.join(globalCodeFolder, foldername));

            subFiles.forEach((subname) => {

                const filePath = path.join(globalCodeFolder, foldername, subname);
                const subStats = fs.statSync(filePath);

                if (subStats.isFile() && /\.html$/.test(filePath) && !shouldNotShow(filePath, docName)) {
                    try {
                        fse.copySync(path.join(globalCodeFolder, foldername, subname), path.join(globalBuildFolder, foldername + '.html'));
                    } catch(err) {
                        console.log('error: ', err, ' \n and subname is: ', subname);
                    }
                  }
            });
        }

    };

    const replaceHtmlKeywords = (targetFile, pageName, docName) => {

        const htmlPath = targetFile;

        const newHtmlContent = fs.readFileSync(htmlPath)
                                  .toString()
                                  .replace(/\$\$\_PAGENAME\_\$\$/g, pageName)
                                  .replace(/\$\$\_DOCNAME\_\$\$/g, docName)
                                  .replace(/\$\$\_CDNURL\_\$\$/g, globalReplaceMap['$$_CDNURL_$$'][globalCurrentEnv]);

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

    // get dir tree
    const getFormatedDirTree = (docName, config) => {

        const currentDocFolder = path.join(globalDocFolder, docName);

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
            const iframeRouteFileInSrc = path.join(globalCodeFolder, `${iframeName}/routes.js`);

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

        let processedFilePath = docFilePath;

        let isImg = false;
        let isMd = false;

        if (isFile) {
            if (/\.((jpg)|(png)|(gif))$/.test(copiedDocFilePath)) {
                processedFilePath = copiedDocFilePath;
                processedFilePath += '.md';
                isImg = true;
            } else if (!/\.md$/.test(copiedDocFilePath)) {
                processedFilePath = copiedDocFilePath;
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

        // fse.copySync(docFilePath, copiedDocFilePath);

        // utime(copiedDocFilePath);

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
                processIframeFromContent(processedFilePath, docFilePath, docNameInfo.md5IframeTheme);
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
        const shownFilePath = path.join(globalCodeFolder, docInfo.docName, 'routes', filesMapItem.md5String + '.vue');

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
        const shownFilePath = path.join(globalCodeFolder, docInfo.docName, 'routes', filesMapItem.md5String + '.vue');

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
        const srcFiles = fs.readdirSync(globalCodeFolder);

        srcFiles.forEach((filename) => {
           if (!/(components)|(libs)/.test(filename)) {
             try {
               fse.removeSync(path.join(globalCodeFolder, filename));
             } catch(err) {

             }
           }
        });
    };

    const getFinalConfigByDocName = (docName) => {

        const globalUserConfig = getConfigInFolder(globalDocFolder);
        const currentDocUserConfig = getConfigInFolder(path.join(globalDocFolder, docName));

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

        let themeTemplateFolder = path.join(__dirname, 'theme', config.theme);
        let iframeThemeTemplateFolder = path.join(__dirname, 'theme', config.theme);

        const themeTemplateFolderInDocFolder = path.join(globalDocFolder, 'book-theme', config.theme);
        const iframeThemeTemplateFolderInDocFolder = path.join(globalDocFolder, 'book-theme', config.theme);

        // prefer themes in doc
        if (fs.existsSync(themeTemplateFolderInDocFolder)) {
            themeTemplateFolder = themeTemplateFolderInDocFolder;
        }

        if (fs.existsSync(iframeThemeTemplateFolderInDocFolder)) {
            iframeThemeTemplateFolder = iframeThemeTemplateFolderInDocFolder;
        }

        const finalConfig = {
            docName: docName,

            dirTree: dirTree,
            filesMap: filesMap,

            docFolderWithDocName: path.join(globalDocFolder, docName),
            processedDocFolderWithDocName: path.join(globalCodeFolder, docName, 'routes', 'processed-doc'),

            theme: config.theme,
            iframeTheme: config.iframeTheme,
            md5IframeTheme: md5(docName + '-' + config.iframeTheme),

            themeTemplateFolder: themeTemplateFolder,
            iframeThemeTemplateFolder: iframeThemeTemplateFolder
        };

        for (let i in config) {
            finalConfig[i] = config[i];
        }

        return finalConfig;
    };

    const processDocs = () => {
        clearSrcCodeFolder();
        emptyBuildFolder();

        const docNames = fs.readdirSync(globalDocFolder);

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

            if (!fs.existsSync(docNameInfo.themeTemplateFolder)) {
                throw Error('主题: ' + docNameInfo.theme + ' 不存在');
                return;
            }

            if (!fs.existsSync(docNameInfo.iframeThemeTemplateFolder)) {
                throw Error('iframe 主题: ' + docNameInfo.iframeTheme + ' 不存在');
                return;
            }

            // create pages
            copyPageFromThemeTemplate(docNameInfo.themeTemplateFolder, path.join(globalCodeFolder, docName));

            // copy iframe defined in doc
            copyPageFromThemeTemplate(path.join(__dirname, 'theme', docNameInfo.iframeTheme), path.join(globalCodeFolder, docNameInfo.md5IframeTheme));

            for (let relativeDocFilePath in docNameInfo.filesMap) {

                // copy doc file
                copyDocFile(docName, relativeDocFilePath);

                // create shown vue file
                createShownVueFile(docName, relativeDocFilePath);

            }

            // write route file
            writeRouteFile(docName, path.join(globalCodeFolder, docName, 'routes.js'));

            // write filetree.js
            writeFileTreeJsFile(docName, path.join(path.join(globalCodeFolder, docName, 'file-tree.js')));

            replaceHtmlKeywords(path.join(globalCodeFolder, docName, 'index.html'), userConfig.pageName || docName, docName);
            replaceHtmlKeywords(path.join(globalCodeFolder, docNameInfo.md5IframeTheme, 'index.html'), docNameInfo.md5IframeTheme, docNameInfo.md5IframeTheme);

            fse.copySync(path.join(globalCodeFolder, docName, 'index.html'), path.join(globalBuildFolder, docName + '.html'));
            fse.copySync(path.join(globalCodeFolder, docNameInfo.md5IframeTheme, 'index.html'), path.join(globalBuildFolder, docNameInfo.md5IframeTheme + '.html'));

            utime(path.join(globalBuildFolder, docName + '.html'));
            utime(path.join(globalBuildFolder, docNameInfo.md5IframeTheme + '.html'));
        });
    };

    const devHandler = () => {

        processDocs();

        gulpWatch([path.join(globalDocFolder, '**/*')], (stats) => {
            const filePath = stats.path;
            const docName = filePath.replace(globalDocFolder, '').replace(/^\./, '').replace(/^\//, '').split('/').shift();

            const userConfig = getFinalConfigByDocName(docName);

            // default config
            if (userConfig._shouldNotCreatePagesReg.test('/' + docName + '/')) {
                return;
            }

            // user config
            if (userConfig.shouldNotCreatePagesReg && userConfig.shouldNotCreatePagesReg.test('/' + docName + '/')) {
                return;
            }

            const relativeDocFilePath = filePath.replace(globalDocFolder, '').replace(/^\./, '').replace(/^\//, '').replace(docName, '');

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
                    docMap[docName] = getDocInfoByDocName(docName);

                    // copy doc file
                    copyDocFile(docName, relativeDocFilePath);

                    // create shown vue file
                    createShownVueFile(docName, relativeDocFilePath);

                    // write route file
                    writeRouteFile(docName, path.join(globalCodeFolder, docName, 'routes.js'));

                    // write filetree.js
                    writeFileTreeJsFile(docName, path.join(path.join(globalCodeFolder, docName, 'file-tree.js')));
                    break;
                case 'unlink':

                    // reget dir tree and filesMap
                    docMap[docName] = getDocInfoByDocName(docName);

                    // write route file
                    writeRouteFile(docName, path.join(globalCodeFolder, docName, 'routes.js'));

                    // write filetree.js
                    writeFileTreeJsFile(docName, path.join(path.join(globalCodeFolder, docName, 'file-tree.js')));

                    // const lastDocNameInfo = docMap[docName];
                    // removeShownVueFile(relativeDocFilePath, lastDocNameInfo);
                    // removeDocFile(relativeDocFilePath, lastDocNameInfo);
                    break;
            }

        });

        const WebpackDevServer = require('webpack-dev-server');

        // get default webpack config
        const webpackConfig = require('./webpack.config')(globalDocFolder, globalCodeFolder, globalBuildFolder);

        // HMR
        webpackConfig.plugins.push(new webpack.HotModuleReplacementPlugin());

        webpackConfig.module.rules.push(getStringReplaceLoader(globalReplaceMap, globalCurrentEnv));

        // rules
        webpackConfig.module.rules.forEach((item) => {

            if (item.test.toString() === /\.css$/.toString()) {
                item.use = ['vue-style-loader', 'css-loader', 'postcss-loader'];
            } else if (item.test.toString() === /\.less$/.toString()) {
                item.use = ['vue-style-loader', 'css-loader', 'postcss-loader', 'less-loader'];
            } else if (item.test.toString() === /\.vue$/.toString()) {
                item.options.loaders.css = ['vue-style-loader', 'css-loader', 'postcss-loader'];
                item.options.loaders.less = ['vue-style-loader', 'css-loader', 'postcss-loader', 'less-loader'];
            }

        });

        for(let i in webpackConfig.entry) {
            webpackConfig.entry[i].unshift(`webpack-dev-server/client?http://127.0.0.1:${context.debugPort}`, 'webpack/hot/dev-server');
        }

        console.log('\nwebpack compiling...');
        const server = new WebpackDevServer(webpack(webpackConfig), {
            contentBase: globalBuildFolder,
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


    const buildHandler = () => {

        processDocs();

        // get default webpack config
        const webpackConfig = require('./webpack.config')(globalCodeFolder, globalBuildFolder);

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
    if (/dev\-/.test(globalCurrentEnv)) {
        devHandler();
    }

    if (/build\-/.test(globalCurrentEnv)) {
        buildHandler();
    }

}

gulp.task('dev', () => {
    processer({
        docFolder: path.join(__dirname, '../docs'),
        buildFolder: path.join(__dirname, '../docs/build'),
        debugPort: 9000,
        currentEnv: 'dev-prod'
    });
});

gulp.task('build', () => {
    processer({
        docFolder: path.join(__dirname, '../docs'),
        buildFolder: path.join(__dirname, '../build'),
        currentEnv: 'build-prod'
    });
});

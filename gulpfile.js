const path = require('path');
const fs = require('fs');
const webpack = require('webpack');
const gulp = require('gulp');
const gulpWatch = require('gulp-watch');
const fse = require('fs-extra');
const md5 = require('md5');

const StringReplacePlugin = require('string-replace-webpack-plugin');

const pathUtil = require('./util/path');
const gitUtil = require('./util/git');
const fileUtil = require('./util/file');
const configUtil = require('./util/config');
const checkUtil = require('./util/check');
const fileMapUtil = require('./util/file-map');

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
const getReplaceMap = (currentFolder) => {

    const gitVersion = gitUtil.getGitVersion(currentFolder);

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

function processer(context) {

    const globalCurrentEnv = context.currentEnv;

    // can be replaced
    const globalDocFolder = context.docFolder;
    let globalBuildFolder = context.buildFolder;

    const globalCodeFolder = path.join(__dirname, 'temp');
    const globalThemeFolder = path.join(__dirname, 'theme');

    const globalReplaceMap = getReplaceMap(globalDocFolder);

    const docMap = {};

    const iframeWatchList = {};

    const createHtmlInBuildFolder = (docName) => {

        // create *.html in build folder
        const stats = fs.statSync(path.join(globalCodeFolder, docName));

        // only working for .html file in folders
        if (stats.isDirectory()) {
            const subFiles = fs.readdirSync(path.join(globalCodeFolder, docName));

            subFiles.forEach((subname) => {

                const filePath = path.join(globalCodeFolder, docName, subname);
                const relativeFilePath = path.join(docName, subname);
                const subStats = fs.statSync(filePath);

                if (subStats.isFile() && /\.html$/.test(filePath) && !checkUtil.checkShouldNotShow(globalDocFolder, filePath)) {
                    try {
                        fse.copySync(path.join(globalCodeFolder, docName, subname), path.join(globalBuildFolder, foldername + '.html'));
                    } catch(err) {
                        console.log('error: ', err, ' \n and subname is: ', subname);
                    }
                  }
            });
        }

    };

    const processIframeDoc = (docFilePath, targetFilePath, md5IframeTheme) => {

        const fileContent = fs.readFileSync(targetFilePath).toString();
        const matchedArr = fileContent.match(/\<iframe\-doc[\s\S]+?\<\/iframe\-doc\>/g);

        // return if there isn't any '<iframe-doc>'
        if (!matchedArr || !matchedArr.length) {
            return;
        }

        const processedFolderName = path.dirname(targetFilePath);

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

            // return if 'iframe-doc' 'src' is blank
            if (!src) {
                console.log('iframe-doc "src" attribute should be a vue or md file');
                return;
            }

            const iframeSrcFilePath = path.join(processedFolderName, src);

            let loadedIframeFile = '';

            if (/\.vue$/.test(src)) {
                loadedIframeFile = path.join(processedFolderName, src + '-iframe-file.md');
            } else if (/\.md$/.test(src)) {
                loadedIframeFile = path.join(processedFolderName, src + '-iframe-file.md');
            }

            const md5String = md5(loadedIframeFile);

            if (!fs.existsSync(loadedIframeFile)) {
                fse.copySync(iframeSrcFilePath, loadedIframeFile);
                fileUtil.utime(loadedIframeFile);

                // add into watch list
                const srcDocFileFolderName = path.dirname(docFilePath);
                iframeWatchList[path.join(srcDocFileFolderName, src)] = {
                    target: loadedIframeFile
                }

            }

            // rewrite file（replace iframe-doc to iframe）
            const replaced = matchedItem
                              .replace('<iframe-doc', '<iframe')
                              .replace('</iframe-doc>', '</iframe>')
                              .replace(src, `/${md5IframeTheme}.html#/${md5String}`);

            while(replacedContent.indexOf(matchedItem) !== -1) {
                replacedContent = replacedContent.replace(matchedItem, replaced);
            }
            fileUtil.writeFileSync(targetFilePath, replacedContent);

            // update iframe routes
            const iframeRouteFileInSrc = path.join(globalCodeFolder, `${md5IframeTheme}/routes.js`);

            let content = fs.readFileSync(iframeRouteFileInSrc).toString();
            const loadedName = md5String + '.md';

            // write routes
            if (!/module\.exports/.test(content)) {
                content = `module.exports = [];`;
            }

            if (content.indexOf(md5String) === -1) {
                const importName = `doc_${md5String}`;
                content = `import ${importName} from '${pathUtil.relative(iframeRouteFileInSrc, loadedIframeFile)}';\n` + content;
                content = content.replace(
                  'module.exports = [',
                  `module.exports = [\n{\n  path: '/${md5String}',\n  component: ${importName}\n},\n`
                );

                fileUtil.writeFileSync(iframeRouteFileInSrc, content);
            }
        });
    };

    const transforFilePath = (docName, relativeDocFilePath) => {

        const docFolderWithDocName = path.join(globalDocFolder, docName);
        const processedDocFolderWithDocName = path.join(globalCodeFolder, docName, 'routes', 'copied-doc');

        const docFilePath = path.join(docFolderWithDocName, relativeDocFilePath);
        const copiedDocFilePath = path.join(processedDocFolderWithDocName, relativeDocFilePath);

        const isFile = true;//fs.statSync(docFilePath).isFile();

        let processedFilePath = copiedDocFilePath;

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
            docFilePath: docFilePath,
            copiedDocFilePath: copiedDocFilePath,
            processedFilePath: processedFilePath,
            isImg: isImg,
            isMd: isMd
        };
    };

    const copyDocFile = (docName, relativeDocFilePath) => {
        const transforedFilePath = transforFilePath(docName, relativeDocFilePath);
        const docFilePath = transforedFilePath.docFilePath;
        const copiedDocFilePath = transforedFilePath.copiedDocFilePath;
        const processedFilePath = transforedFilePath.processedFilePath;

        // copy
        fse.copySync(docFilePath, copiedDocFilePath);
        fileUtil.utime(copiedDocFilePath);
    };

    const processDocFile = (docName, relativeDocFilePath) => {
        const docNameInfo = docMap[docName];
        const md5IframeTheme = docNameInfo.md5IframeTheme;

        const transforedFilePath = transforFilePath(docName, relativeDocFilePath);
        const docFilePath = transforedFilePath.docFilePath;
        const copiedDocFilePath = transforedFilePath.copiedDocFilePath;
        const processedFilePath = transforedFilePath.processedFilePath;

        // step: create new file in src/** by file type
        if (fs.statSync(docFilePath).isFile()) {

            if (transforedFilePath.isImg) {
                const content = `![img](./${relativeDocFilePath.split('/').pop()}) \n<style scoped>p {text-align: center;}</style>`;
                fileUtil.writeFileSync(processedFilePath, content);
            } else if (!transforedFilePath.isMd) {
                const extname = path.extname(copiedDocFilePath).replace('.', '');
                const content = fs.readFileSync(docFilePath).toString();
                fileUtil.writeFileSync(processedFilePath, '```' + extname + '\n' + content + (/\n$/.test(content) ? '```' :'\n```'));
            } else if (transforedFilePath.isMd) {
                processIframeDoc(docFilePath, copiedDocFilePath, md5IframeTheme);
            }
        }
    };

    const createShownPage = (docName, relativeDocFilePath) => {

        const docNameInfo = docMap[docName];

        const transforedFilePath = transforFilePath(docNameInfo.docName, relativeDocFilePath);
        const processedFilePath = transforedFilePath.processedFilePath;

        const shownFilesMapItem = docNameInfo.shownFilesMap[relativeDocFilePath];

        // create shown vue pages
        const shownFilePath = path.join(globalCodeFolder, docNameInfo.docName, 'routes', 'route-' + shownFilesMapItem.md5String + '.vue');

        // format 'x-x-x' to '[x, x, x]'
        const fileIndex = JSON.stringify(shownFilesMapItem.index.split('-')).replace(/\"/g, "'");

        let shownVueContent = '';
        if (fs.statSync(transforedFilePath.docFilePath).isFile()) {
            const templateContent = fs.readFileSync(path.join(docNameInfo.themeTemplateFolder, 'routes-template/file-template.vue')).toString();
            shownVueContent = templateContent.replace(/\$\$\_FILE\_INDEX\_\$\$/g, JSON.stringify(fileIndex))
                                             .replace(/\$\$\_DOC\_PATH\_\$\$/g, JSON.stringify('./' + pathUtil.relative(shownFilePath, processedFilePath)));
        } else {
            const templateContent = fs.readFileSync(path.join(docNameInfo.themeTemplateFolder, 'routes-template/dir-template.vue')).toString();
            shownVueContent = templateContent.replace(/\$\$\_FILE\_INDEX\_\$\$/g, JSON.stringify(fileIndex));
        }

        fse.ensureFileSync(shownFilePath);

        fileUtil.writeFileSync(shownFilePath, shownVueContent);

    };

    // create file-tree.js
    const writeFileTreeJsFile = (docName, targetFile) => {

        const docNameInfo = docMap[docName];
        const dirTree = docNameInfo.dirTree;

        fse.ensureFileSync(targetFile);
        const contentStr = JSON.stringify(dirTree);
        fileUtil.writeFileSync(targetFile, `module.exports=${contentStr}`);
    };

    // create vue routes
    const writeRouteFile = (docName, targetRouteFile) => {

        const docNameInfo = docMap[docName];
        const shownFilesMap = docNameInfo.shownFilesMap;

        // 创建 routes.js
        const routesFilePath = targetRouteFile;
        let routesContent = ``;
        for (relativeDocFilePath in shownFilesMap) {
            routesContent += `\nimport ${'doc_' + shownFilesMap[relativeDocFilePath].md5String} from './routes/route-${shownFilesMap[relativeDocFilePath].md5String}.vue';`;
        }

        routesContent += `\n\nmodule.exports = [\n`;
        for (relativeDocFilePath in shownFilesMap) {
            routesContent += `{
              path: '${shownFilesMap[relativeDocFilePath].routerPath}',
              component: ${'doc_' + shownFilesMap[relativeDocFilePath].md5String}
            },`;
        }
        routesContent = routesContent.replace(/\,$/, '');
        routesContent += '\n];';

        fse.ensureFileSync(routesFilePath);

        fileUtil.writeFileSync(routesFilePath, routesContent);
    };

    const getDocInfo = (docName) => {

        const config = configUtil.mergeUserConfig(globalDocFolder, path.join(globalDocFolder, docName));

        // set template folder
        let themeTemplateFolder = path.join(globalThemeFolder, config.theme);
        let iframeThemeTemplateFolder = path.join(globalThemeFolder, config.theme);
        const userThemeTemplateFolder = path.join(globalDocFolder, 'book-theme', config.theme);
        const userIframeThemeTemplateFolder = path.join(globalDocFolder, 'book-theme', config.theme);

        // prefer themes in doc
        if (fs.existsSync(userThemeTemplateFolder)) {
            themeTemplateFolder = userThemeTemplateFolder;
        }

        if (fs.existsSync(userIframeThemeTemplateFolder)) {
            iframeThemeTemplateFolder = userIframeThemeTemplateFolder;
        }

        const dirTree = fileMapUtil.getFormatedDirTree(globalDocFolder, path.join(globalDocFolder, docName));

        const finalConfig = {
            docName: docName,

            dirTree: dirTree,
            shownFilesMap: fileMapUtil.getFilesMapByDirTree(dirTree),

            theme: config.theme,
            iframeTheme: config.iframeTheme,
            md5IframeTheme: encodeURIComponent(docName) + '-iframe', // + md5(docName + '-' + config.iframeTheme),

            themeTemplateFolder: themeTemplateFolder,
            iframeThemeTemplateFolder: iframeThemeTemplateFolder
        };

        // merge user config
        for (let i in config) {
            finalConfig[i] = config[i];
        }

        return finalConfig;
    };

    const createPage = (currentFolder) => {

        const docName = pathUtil.getNameFromPath(currentFolder);

        // if docName is not folder, return
        if (!fs.statSync(currentFolder).isDirectory()) {
            return;
        }

        // if docName should not show, return
        if (checkUtil.checkShouldNotShow(globalDocFolder, path.join(globalDocFolder, docName))) {
            return;
        }

        const docNameInfo = getDocInfo(docName);

        docMap[docName] = docNameInfo;

        if (!fs.existsSync(docNameInfo.themeTemplateFolder)) {
            throw Error('theme: ' + docNameInfo.theme + ' not exists');
            return;
        }

        if (!fs.existsSync(docNameInfo.iframeThemeTemplateFolder)) {
            throw Error('iframe theme: ' + docNameInfo.iframeTheme + ' not exists');
            return;
        }

        // create page from template
        fileUtil.copyPageFromThemeTemplate(docNameInfo.themeTemplateFolder, path.join(globalCodeFolder, docName));

        // copy iframe page from template
        fileUtil.copyPageFromThemeTemplate(path.join(globalThemeFolder, docNameInfo.iframeTheme), path.join(globalCodeFolder, docNameInfo.md5IframeTheme));

        // copy all current doc files to tmp/**/routes/copied-doc
        fse.copySync(path.join(globalDocFolder, docName), path.join(__dirname, 'temp', docName, 'routes/copied-doc'));

        // set utimes to prevent multi webpack callback
        fileUtil.readdirSync(path.join(__dirname, 'temp', docName, 'routes/copied-doc')).forEach((filePath) => {
            fileUtil.utime(filePath);
        });

        // only create shown page
        for (let relativeDocFilePath in docNameInfo.shownFilesMap) {

            processDocFile(docName, relativeDocFilePath);

            // create page file
            createShownPage(docName, relativeDocFilePath);

        }

        // write route file
        writeRouteFile(docName, path.join(globalCodeFolder, docName, 'routes.js'));

        // write filetree.js
        writeFileTreeJsFile(docName, path.join(path.join(globalCodeFolder, docName, 'file-tree.js')));

        const cdnUrl = globalReplaceMap['$$_CDNURL_$$'][globalCurrentEnv];
        fileUtil.replaceHtmlKeywords(path.join(globalCodeFolder, docName, 'index.html'), configUtil.mergeUserConfig(globalDocFolder, path.join(globalDocFolder, docName)).pageName || docName, docName, cdnUrl);
        fileUtil.replaceHtmlKeywords(path.join(globalCodeFolder, docNameInfo.md5IframeTheme, 'index.html'), docNameInfo.md5IframeTheme, docNameInfo.md5IframeTheme, cdnUrl);

        // create .html files in build
        fse.copySync(path.join(globalCodeFolder, docName, 'index.html'), path.join(globalBuildFolder, docName + '.html'));
        fse.copySync(path.join(globalCodeFolder, docNameInfo.md5IframeTheme, 'index.html'), path.join(globalBuildFolder, docNameInfo.md5IframeTheme + '.html'));
    };

    const processDocs = () => {
        fse.ensureDirSync(globalCodeFolder);
        fileUtil.emptyFolder(globalCodeFolder, /(components)|(libs)/);
        fileUtil.emptyFolder(globalBuildFolder);
        fs.readdirSync(globalDocFolder).forEach((docName) => {
            createPage(path.join(globalDocFolder, docName));
        });
    };

    const devHandler = () => {

        processDocs();

        gulpWatch([path.join(globalDocFolder, '**/*')], (stats) => {

            const filePath = stats.path;
            const docName = filePath.replace(globalDocFolder, '').replace(/^\./, '').replace(/^\//, '').split('/').shift();

            const userConfig = configUtil.mergeUserConfig(globalDocFolder, path.join(globalDocFolder, docName));
            const relativeDocFilePath = filePath.replace(globalDocFolder, '').replace(/^\./, '').replace(/^\//, '').replace(docName, '');

            // copy iframe files
            if (iframeWatchList[filePath]) {
                fse.copySync(filePath, iframeWatchList[filePath].target);
            }

            // return if this is not in doc dir, such as 'bookconfig.js'
            if (!/\//.test(filePath.replace(globalDocFolder, '').replace(/^\./, '').replace(/^\//, ''))) {
                return;
            }

            let docNameInfo = getDocInfo(docName);

            switch(stats.event) {
                case 'change':
                    if (checkUtil.checkShouldNotShow(globalDocFolder, filePath)) {
                        copyDocFile(docName, relativeDocFilePath);
                    } else {
                        copyDocFile(docName, relativeDocFilePath);
                        processDocFile(docName, relativeDocFilePath);
                    }

                    break;
                case 'add':

                    if (checkUtil.checkShouldNotShow(globalDocFolder, filePath)) {
                        copyDocFile(docName, relativeDocFilePath);
                    } else {

                        // reget dir tree and shownFilesMap
                        docMap[docName] = getDocInfo(docName);

                        // copy doc file
                        copyDocFile(docName, relativeDocFilePath);
                        processDocFile(docName, relativeDocFilePath);

                        // create shown vue file
                        createShownPage(docName, relativeDocFilePath);

                        // write route file
                        writeRouteFile(docName, path.join(globalCodeFolder, docName, 'routes.js'));

                        // write filetree.js
                        writeFileTreeJsFile(docName, path.join(path.join(globalCodeFolder, docName, 'file-tree.js')));
                    }
                    break;
                case 'unlink':

                    // reget dir tree and shownFilesMap
                    docMap[docName] = getDocInfo(docName);

                    // write route file
                    writeRouteFile(docName, path.join(globalCodeFolder, docName, 'routes.js'));

                    // write filetree.js
                    writeFileTreeJsFile(docName, path.join(path.join(globalCodeFolder, docName, 'file-tree.js')));
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
        docFolder: path.join(__dirname, 'docs'),
        buildFolder: path.join(__dirname, 'build'),
        debugPort: 9000,
        currentEnv: 'dev-prod'
    });
});

gulp.task('build', () => {
    processer({
        docFolder: path.join(__dirname, 'docs'),
        buildFolder: path.join(__dirname, 'build'),
        currentEnv: 'build-prod'
    });
});

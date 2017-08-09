const path = require('path');
const fs = require('fs');
const webpack = require('webpack');
const gulp = require('gulp');
const gulpWatch = require('gulp-watch');
const fse = require('fs-extra');
const md5 = require('md5');

const StringReplacePlugin = require('string-replace-webpack-plugin');

const pathUtil = require('../util/path');
const gitUtil = require('../util/git');
const fileUtil = require('../util/file');
const configUtil = require('../util/config');
const checkUtil = require('../util/check');
const dirInfoUtil = require('../util/dir-info');

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
    const globalPageFolder = context.docFolder;
    let globalBuildFolder = context.buildFolder;

    const globalCodeFolder = pathUtil.codeFolder;

    const globalReplaceMap = getReplaceMap(globalPageFolder);

    let globalPageInfo = dirInfoUtil.getDocInfo(globalPageFolder, globalPageFolder);

    const globalPageName = pathUtil.getNameFromPath(globalPageFolder);

    const globalCopiedDocFolder = path.join(globalCodeFolder, globalPageName, 'routes/copied-doc');

    const docMap = {};

    const iframeWatchList = {};

    const processIframeDoc = (docFilePath, targetFilePath) => {

        const md5IframeTheme = globalPageInfo.md5IframeTheme;

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

    const transforFilePath = (relativeDocFilePath) => {

        const docFilePath = path.join(globalPageFolder, relativeDocFilePath);
        const copiedDocFilePath = path.join(globalCopiedDocFolder, relativeDocFilePath);

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
            docFilePath,
            copiedDocFilePath,
            processedFilePath,
            isImg,
            isMd
        };
    };

    const copyDocFile = (relativeDocFilePath) => {
        const transforedFilePath = transforFilePath(relativeDocFilePath);
        const docFilePath = transforedFilePath.docFilePath;
        const copiedDocFilePath = transforedFilePath.copiedDocFilePath;
        const processedFilePath = transforedFilePath.processedFilePath;

        // copy
        fse.copySync(docFilePath, copiedDocFilePath);
        fileUtil.utime(copiedDocFilePath);
    };

    const processDocFile = (relativeDocFilePath) => {

        const transforedFilePath = transforFilePath(relativeDocFilePath);
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
                processIframeDoc(docFilePath, copiedDocFilePath);
            }
        }
    };

    const createShownPage = (relativeDocFilePath) => {

        const transforedFilePath = transforFilePath(relativeDocFilePath);
        const processedFilePath = transforedFilePath.processedFilePath;

        const shownFilesMapItem = globalPageInfo.shownFilesMap[relativeDocFilePath];

        // create shown vue pages
        const shownFilePath = path.join(globalCodeFolder, globalPageName, 'routes', 'route-' + shownFilesMapItem.md5String + '.vue');

        // format 'x-x-x' to '[x, x, x]'
        const fileIndex = JSON.stringify(shownFilesMapItem.index.split('-')).replace(/\"/g, "'");

        let shownVueContent = '';
        if (fs.statSync(transforedFilePath.docFilePath).isFile()) {
            const templateContent = fs.readFileSync(path.join(globalPageInfo.themeTemplateFolder, 'routes-template/file-template.vue')).toString();
            shownVueContent = templateContent.replace(/\$\$\_FILE\_INDEX\_\$\$/g, JSON.stringify(fileIndex))
                                             .replace(/\$\$\_DOC\_PATH\_\$\$/g, JSON.stringify('./' + pathUtil.relative(shownFilePath, processedFilePath)));
        } else {
            const templateContent = fs.readFileSync(path.join(globalPageInfo.themeTemplateFolder, 'routes-template/dir-template.vue')).toString();
            shownVueContent = templateContent.replace(/\$\$\_FILE\_INDEX\_\$\$/g, JSON.stringify(fileIndex));
        }

        fse.ensureFileSync(shownFilePath);

        fileUtil.writeFileSync(shownFilePath, shownVueContent);

    };

    // create file-tree.js
    const writeFileTreeJsFile = (targetFile) => {

        const dirTree = globalPageInfo.dirTree;

        fse.ensureFileSync(targetFile);
        const contentStr = JSON.stringify(dirTree);
        fileUtil.writeFileSync(targetFile, `module.exports=${contentStr}`);
    };

    // create vue routes
    const writeRouteFile = (targetRouteFile) => {

        const shownFilesMap = globalPageInfo.shownFilesMap;

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

    const createPage = () => {

        // if it is not folder, return
        if (!fs.statSync(globalPageFolder).isDirectory()) {
            return;
        }

        if (!fs.existsSync(globalPageInfo.themeTemplateFolder)) {
            throw Error('theme: ' + globalPageInfo.theme + ' not exists');
            return;
        }

        if (!fs.existsSync(globalPageInfo.iframeThemeTemplateFolder)) {
            throw Error('iframe theme: ' + globalPageInfo.iframeTheme + ' not exists');
            return;
        }

        // create page from template
        fileUtil.copyPageFromThemeTemplate(globalPageInfo.themeTemplateFolder, path.join(globalCodeFolder, globalPageName));

        // copy iframe page from template
        fileUtil.copyPageFromThemeTemplate(path.join(pathUtil.themeFolder, globalPageInfo.iframeTheme), path.join(globalCodeFolder, globalPageInfo.md5IframeTheme));

        // copy all current doc files to tmp/**/routes/copied-doc
        fse.copySync(globalPageFolder, globalCopiedDocFolder);

        // set utimes to prevent multi webpack callback
        fileUtil.readdirSync(globalCopiedDocFolder).forEach((filePath) => {
            fileUtil.utime(filePath);
        });

        // only create shown page
        for (let relativeDocFilePath in globalPageInfo.shownFilesMap) {

            if (!checkUtil.checkShouldNotShow(globalPageFolder, path.join(globalPageFolder, relativeDocFilePath))) {

                processDocFile(relativeDocFilePath);

                // create page file
                createShownPage(relativeDocFilePath);
            }

        }


        // write route file
        writeRouteFile(path.join(globalCodeFolder, globalPageName, 'routes.js'));

        // write filetree.js
        writeFileTreeJsFile(path.join(globalCodeFolder, globalPageName, 'file-tree.js'));

        const cdnUrl = globalReplaceMap['$$_CDNURL_$$'][globalCurrentEnv];
        fileUtil.replaceHtmlKeywords(path.join(globalCodeFolder, globalPageName, 'index.html'), configUtil.mergeUserConfig(globalPageFolder, globalPageFolder).pageName || globalPageName, globalPageName, cdnUrl);
        fileUtil.replaceHtmlKeywords(path.join(globalCodeFolder, globalPageInfo.md5IframeTheme, 'index.html'), globalPageInfo.md5IframeTheme, globalPageInfo.md5IframeTheme, cdnUrl);

        // create .html files in build
        fse.copySync(path.join(globalCodeFolder, globalPageName, 'index.html'), path.join(globalBuildFolder, globalPageName + '.html'));
        fse.copySync(path.join(globalCodeFolder, globalPageInfo.md5IframeTheme, 'index.html'), path.join(globalBuildFolder, globalPageInfo.md5IframeTheme + '.html'));
    };

    const processPage = () => {
        fse.removeSync(globalBuildFolder);
        fse.ensureDirSync(globalBuildFolder);
        fse.ensureDirSync(globalCodeFolder);
        fileUtil.emptyFolder(globalCodeFolder, /(components)|(libs)/);
        fileUtil.emptyFolder(globalBuildFolder);
        createPage(globalPageFolder);
    };

    const devHandler = () => {

        processPage();

        gulpWatch([path.join(globalPageFolder, '**/*')], (stats) => {

            const filePath = stats.path;

            const userConfig = configUtil.mergeUserConfig(globalPageFolder, globalPageFolder);
            let relativeDocFilePath = filePath.replace(globalPageFolder, '');

            // same as file map
            if (!/^\//.test(relativeDocFilePath)) {
                relativeDocFilePath = '/' + relativeDocFilePath;
            }

            // copy iframe files
            if (iframeWatchList[filePath]) {
                fse.copySync(filePath, iframeWatchList[filePath].target);
            }

            switch(stats.event) {
                case 'change':
                    if (checkUtil.checkShouldNotShow(globalPageFolder, filePath)) {
                        copyDocFile(relativeDocFilePath);
                    } else {
                        copyDocFile(relativeDocFilePath);
                        processDocFile(relativeDocFilePath);
                    }

                    break;
                case 'add':

                    if (checkUtil.checkShouldNotShow(globalPageFolder, filePath)) {
                        copyDocFile(relativeDocFilePath);
                    } else {

                        // reget dir tree and shownFilesMap
                        globalPageInfo = dirInfoUtil.getDocInfo(globalPageFolder, globalPageFolder);

                        // copy doc file
                        copyDocFile(relativeDocFilePath);
                        processDocFile(relativeDocFilePath);

                        // create shown vue file
                        createShownPage(relativeDocFilePath);

                        // write route file
                        writeRouteFile(path.join(globalCodeFolder, globalPageName, 'routes.js'));

                        // write filetree.js
                        writeFileTreeJsFile(path.join(path.join(globalCodeFolder, globalPageName, 'file-tree.js')));
                    }
                    break;
                case 'unlink':

                    // reget dir tree and shownFilesMap
                    globalPageInfo = dirInfoUtil.getDocInfo(globalPageFolder, globalPageFolder);

                    // write route file
                    writeRouteFile(path.join(globalCodeFolder, globalPageName, 'routes.js'));

                    // write filetree.js
                    writeFileTreeJsFile(path.join(path.join(globalCodeFolder, globalPageName, 'file-tree.js')));
                    break;
            }

        });

        const WebpackDevServer = require('webpack-dev-server');

        // get default webpack config
        const webpackConfig = require('../webpack.config')(globalPageFolder, globalCodeFolder, globalBuildFolder);

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

        processPage();

        // get default webpack config
        const webpackConfig = require('../webpack.config')(globalCodeFolder, globalBuildFolder);

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

module.exports = processer;

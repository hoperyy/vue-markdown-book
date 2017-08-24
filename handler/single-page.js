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

function processer(context) {

    const $currentEnv = context.currentEnv;

    // can be replaced
    const $docFolder = context.docFolder;
    const $buildFolder = context.buildFolder;

    const $pagePath = context.pagePath.index;
    const $iframePagePath = context.pagePath.iframe;

    const $codeFolder = context.codeFolder;
    const $replaceMap = context.replace($docFolder);
    let $dirInfo = dirInfoUtil.getDocInfo($docFolder, $docFolder);
    const $dirName = pathUtil.getNameFromPath($docFolder);
    const $copiedDocFolder = path.join($codeFolder, $dirName, 'routes/copied-doc');

    const $iframeWatchList = {};

    const processIframeDoc = (docFilePath, targetFilePath) => {

        const md5IframeTheme = $dirInfo.md5IframeTheme;

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
                $iframeWatchList[path.join(srcDocFileFolderName, src)] = {
                    target: loadedIframeFile
                }

            }

            // rewrite file（replace iframe-doc to iframe）
            const replaced = matchedItem
                              .replace('<iframe-doc', '<iframe')
                              .replace('</iframe-doc>', '</iframe>')
                              .replace(src, `iframe.html#/${md5String}`);

            while(replacedContent.indexOf(matchedItem) !== -1) {
                replacedContent = replacedContent.replace(matchedItem, replaced);
            }
            fileUtil.writeFileSync(targetFilePath, replacedContent);

            // update iframe routes
            const iframeRouteFileInSrc = path.join($codeFolder, `${md5IframeTheme}/routes.js`);

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

        const docFilePath = path.join($docFolder, relativeDocFilePath);
        const copiedDocFilePath = path.join($copiedDocFolder, relativeDocFilePath);

        let processedFilePath = copiedDocFilePath;

        let isImg = false;
        let isMd = false;

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

        const shownFilesMapItem = $dirInfo.shownFilesMap[relativeDocFilePath];

        // create shown vue pages
        const shownFilePath = path.join($codeFolder, $dirName, 'routes', 'route-' + shownFilesMapItem.md5String + '.vue');

        // format 'x-x-x' to '[x, x, x]'
        const fileIndex = JSON.stringify(shownFilesMapItem.index.split('-')).replace(/\"/g, "'");

        let shownVueContent = '';
        if (fs.statSync(transforedFilePath.docFilePath).isFile()) {
            const templateContent = fs.readFileSync(path.join($dirInfo.themeTemplateFolder, 'routes-template/file-template.vue')).toString();
            shownVueContent = templateContent.replace(/\$\$\_FILE\_INDEX\_\$\$/g, JSON.stringify(fileIndex))
                                             .replace(/\$\$\_DOC\_PATH\_\$\$/g, JSON.stringify('./' + pathUtil.relative(shownFilePath, processedFilePath)));
        } else {
            const templateContent = fs.readFileSync(path.join($dirInfo.themeTemplateFolder, 'routes-template/dir-template.vue')).toString();
            shownVueContent = templateContent.replace(/\$\$\_FILE\_INDEX\_\$\$/g, JSON.stringify(fileIndex));
        }

        fse.ensureFileSync(shownFilePath);

        fileUtil.writeFileSync(shownFilePath, shownVueContent);

    };

    // create file-tree.js
    const writeFileTreeJsFile = (targetFile) => {
        fse.ensureFileSync(targetFile);
        fileUtil.writeFileSync(targetFile, `module.exports=${JSON.stringify($dirInfo.dirTree)}`);
    };

    // create vue routes
    const writeRouteFile = (targetRouteFile) => {

        const shownFilesMap = $dirInfo.shownFilesMap;

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
        if (!fs.statSync($docFolder).isDirectory()) {
            return;
        }

        if (!fs.existsSync($dirInfo.themeTemplateFolder)) {
            throw Error('theme: ' + $dirInfo.theme + ' not exists');
            return;
        }

        if (!fs.existsSync($dirInfo.iframeThemeTemplateFolder)) {
            throw Error('iframe theme: ' + $dirInfo.iframeTheme + ' not exists');
            return;
        }

        // create page from template
        fileUtil.copyPageFromThemeTemplate($dirInfo.themeTemplateFolder, path.join($codeFolder, $dirName));

        // copy iframe page from template
        fileUtil.copyPageFromThemeTemplate($dirInfo.iframeThemeTemplateFolder, path.join($codeFolder, $dirInfo.md5IframeTheme));

        // copy all current doc files to tmp/**/routes/copied-doc
        fs.readdirSync($docFolder).forEach((filename) => {
            const filePath = path.join($docFolder, filename);

            if (configUtil._shouldNotPutInCopiedFolder.test(filename)) {
                return;
            }

            fse.copySync(filePath, path.join($copiedDocFolder, filename));
        });

        // set utimes to prevent multi webpack callback
        fileUtil.readdirSync($copiedDocFolder).forEach((filePath) => {
            fileUtil.utime(filePath);
        });

        // only create shown page
        for (let relativeDocFilePath in $dirInfo.shownFilesMap) {

            processDocFile(relativeDocFilePath);

            // create page file
            createShownPage(relativeDocFilePath);

        }

        // write route file
        writeRouteFile(path.join($codeFolder, $dirName, 'routes.js'));

        // write filetree.js
        writeFileTreeJsFile(path.join($codeFolder, $dirName, 'file-tree.js'));

        const cdnUrl = $replaceMap['$$_CDNURL_$$'][$currentEnv];
        fileUtil.replaceHtmlKeywords(path.join($codeFolder, $dirName, 'index.html'), { pageName: configUtil.mergeUserConfig($docFolder, $docFolder).pageName || $dirName, docName: $dirName, cdnUrl});
        fileUtil.replaceHtmlKeywords(path.join($codeFolder, $dirInfo.md5IframeTheme, 'index.html'), { pageName: $dirInfo.md5IframeTheme, docName: $dirInfo.md5IframeTheme, cdnUrl});

        // create .html files in build
        fse.copySync(path.join($codeFolder, $dirName, 'index.html'), path.join($buildFolder, $pagePath));
        fse.copySync(path.join($codeFolder, $dirInfo.md5IframeTheme, 'index.html'), path.join($buildFolder, $iframePagePath));
    };

    const processPage = () => {
        fse.removeSync($buildFolder);
        fse.ensureDirSync($buildFolder);
        fse.ensureDirSync($codeFolder);
        fileUtil.emptyFolder($codeFolder, /(node_modules)|(\.babelrc)|(postcss\.config\.js)|(components)|(libs)/);
        fileUtil.emptyFolder($buildFolder);
        createPage($docFolder);
    };

    const devHandler = () => {

        processPage();

        gulpWatch([path.join($docFolder, '**/*')], (stats) => {

            const filePath = stats.path;

            const userConfig = configUtil.mergeUserConfig($docFolder, $docFolder);
            let relativeDocFilePath = filePath.replace($docFolder, '');

            if (configUtil._shouldNotPutInCopiedFolder.test(relativeDocFilePath)) {
                return;
            }

            // same as file map
            if (!/^\//.test(relativeDocFilePath)) {
                relativeDocFilePath = '/' + relativeDocFilePath;
            }

            // copy iframe files
            if ($iframeWatchList[filePath]) {
                fse.copySync(filePath, $iframeWatchList[filePath].target);
            }

            switch(stats.event) {
                case 'change':
                    if (checkUtil.checkShouldNotShow($docFolder, filePath)) {
                        copyDocFile(relativeDocFilePath);
                    } else {
                        copyDocFile(relativeDocFilePath);
                        processDocFile(relativeDocFilePath);
                    }

                    break;
                case 'add':

                    if (checkUtil.checkShouldNotShow($docFolder, filePath)) {
                        copyDocFile(relativeDocFilePath);
                    } else {

                        // reget dir tree and shownFilesMap
                        $dirInfo = dirInfoUtil.getDocInfo($docFolder, $docFolder);

                        // copy doc file
                        copyDocFile(relativeDocFilePath);

                        // create shown vue file
                        const tempArr = relativeDocFilePath.split('/');
                        while(tempArr.length) {

                            const currentRelativePath = tempArr.join('/');

                            if (currentRelativePath) {
                                processDocFile(currentRelativePath);
                                createShownPage(currentRelativePath);
                            }

                            tempArr.pop();

                        }

                        // write route file
                        writeRouteFile(path.join($codeFolder, $dirName, 'routes.js'));

                        // write filetree.js
                        writeFileTreeJsFile(path.join(path.join($codeFolder, $dirName, 'file-tree.js')));
                    }
                    break;
                case 'unlink':

                    // reget dir tree and shownFilesMap
                    $dirInfo = dirInfoUtil.getDocInfo($docFolder, $docFolder);

                    // write route file
                    writeRouteFile(path.join($codeFolder, $dirName, 'routes.js'));

                    // write filetree.js
                    writeFileTreeJsFile(path.join(path.join($codeFolder, $dirName, 'file-tree.js')));
                    break;
            }

        });

        const WebpackDevServer = require('webpack-dev-server');

        // get default webpack config
        const webpackConfig = require('../webpack.config')($docFolder, $codeFolder, $buildFolder);

        // HMR
        webpackConfig.plugins.push(new webpack.HotModuleReplacementPlugin());

        // webpackConfig.module.rules.push(getStringReplaceLoader($replaceMap, $currentEnv));

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
            contentBase: $buildFolder,
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
        const webpackConfig = require('../webpack.config')($docFolder, $codeFolder, $buildFolder);

        // rules
        // webpackConfig.module.rules.push(getStringReplaceLoader($replaceMap, $currentEnv));

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

        console.log('\nwebpack compiling...');
        webpack(webpackConfig, () => {
            console.log('compilication done.');
        });

    };

    // run
    if (/dev\-/.test($currentEnv)) {
        devHandler();
    }

    if (/build\-/.test($currentEnv)) {
        buildHandler();
    }

}

module.exports = processer;


const path = require('path');
const fs = require('fs');

module.exports = {
    processIframeDoc(docFilePath, targetFilePath, md5IframeTheme) {

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
    }
};

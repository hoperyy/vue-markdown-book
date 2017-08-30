
const fs = require('fs');
const path = require('path');

const md5 = require('md5');

const configUtil = require('./config');
const fileUtil = require('./file');
const pathUtil = require('./path');

const sortTree = (tree, userSort) => {
    const getTreePathArr = (children) => {
        let treePathArr = [];
        children.forEach(item => {
            let _path = item.path.replace(/^\//, '');

            if (!/^\//.test(_path)) {
                _path = '/' + _path;
            }

            if (!/\/$/.test(_path)) {
                _path += '/';
            }

            treePathArr.push(_path);
        });

        return treePathArr;
    };

    const moveToFront = (arr, index) => {
        const obj = arr[index];
        arr.splice(index, 1);
        arr.unshift(obj);
    };

    // sort
    let treePathArr = getTreePathArr(tree.children);
    if (userSort && Object.prototype.toString.call(userSort) === '[object Array]') {

        for (let i = userSort.length - 1; i >= 0; i--) {
            let item = userSort[i];

            if (!/^\//.test(item)) {
                item = '/' + item;
            }

            if (!/\/$/.test(item)) {
                item += '/';
            }

            const index = treePathArr.indexOf(item);

            if (index !== -1) {
                moveToFront(tree.children, index);
            }

            treePathArr = getTreePathArr(tree.children);

        }

    }
};

module.exports = {

    getFormatedDirTree(rootFolder, currentDocFolder) {

        const mergedConfig = configUtil.mergeUserConfig(rootFolder, currentDocFolder);

        // get dir tree
        const dirTree = fileUtil.readdirTree(currentDocFolder, {
            // same as checkUtil.checkShouldNotShow()
            exclude: [configUtil._shouldNotPutInCopiedFolder, configUtil._shouldNotShowReg, mergedConfig.shouldNotShowReg]
        });

        // format dir tree path
        const formateDirTree = (tree, fileIndex) => {

          if (!tree || !tree.children) {
              return;
          }

          sortTree(tree, mergedConfig.sort);

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

              // item routerPath
              item.routerPath = mergedConfig.shouldNotShowExtnameReg ? item.path.replace(mergedConfig.shouldNotShowExtnameReg, '') : item.path;

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
    },

    getFilesMapByDirTree(dirTree) {

        const shownFilesMap = {};

        const act = (tree) => {

            if (!tree || !tree.children) {
                return;
            }
            tree.children.forEach((item, index) => {

                shownFilesMap[item.path] = item;

                if (item.children) {
                    act(item, item.index);
                }

            });

        };

        act(dirTree);

        return shownFilesMap;
    },

    getDocInfo(rootFolder, currentDocFolder) {

        const docName = pathUtil.getNameFromPath(currentDocFolder);
        const config = configUtil.mergeUserConfig(rootFolder, currentDocFolder);

        // set template folder
        let themeTemplateFolder = path.join(pathUtil.themeFolder, config.theme);
        let iframeThemeTemplateFolder = path.join(pathUtil.themeFolder, config.iframeTheme);
        const userThemeTemplateFolder = path.join(rootFolder, 'book-theme', config.theme);
        const userIframeThemeTemplateFolder = path.join(rootFolder, 'book-theme', config.iframeTheme);

        // prefer themes in doc
        if (fs.existsSync(userThemeTemplateFolder)) {
            themeTemplateFolder = userThemeTemplateFolder;
        }

        if (fs.existsSync(userIframeThemeTemplateFolder)) {
            iframeThemeTemplateFolder = userIframeThemeTemplateFolder;
        }

        const dirTree = this.getFormatedDirTree(rootFolder, currentDocFolder);

        const finalConfig = {
            docName,

            dirTree,
            shownFilesMap: this.getFilesMapByDirTree(dirTree),

            theme: config.theme,
            iframeTheme: config.iframeTheme,
            md5IframeTheme: encodeURIComponent(docName) + '-iframe',

            themeTemplateFolder: themeTemplateFolder,
            iframeThemeTemplateFolder: iframeThemeTemplateFolder
        };

        // merge user config
        for (let i in config) {
            finalConfig[i] = config[i];
        }

        return finalConfig;
    }
};

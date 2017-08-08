
const fs = require('fs');
const path = require('path');

const md5 = require('md5');

const configUtil = require('./config');
const fileUtil = require('./file');

module.exports = {
    getFormatedDirTree(rootFolder, currentDocFolder) {

        const mergedConfig = configUtil.mergeUserConfig(rootFolder, currentDocFolder);

        // get dir tree
        const dirTree = fileUtil.readdirTree(currentDocFolder, {
            exclude: [mergedConfig._shouldNotShowReg, mergedConfig.shouldNotShowReg]
        });

        // format dir tree path
        const formateDirTree = (tree, fileIndex) => {

          if (!tree || !tree.children) {
              return;
          }

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
    }
};

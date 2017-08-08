const fs = require('fs');
const path = require('path');
const fse = require('fs-extra');
const readdirTree = require('directory-tree-enhancer');

const readdirEnhanced = require('readdir-enhanced').sync;
const readdirSync = (dir) => {
    return readdirEnhanced(dir, {
        deep: true,
        basePath: dir
    });
};

module.exports = {

    readdirTree,

    readdirSync,

    utime(filePath) {
        fs.utimesSync(filePath, ((Date.now() - 10 * 1000)) / 1000, (Date.now() - 10 * 1000) / 1000);
    },

    emptyFolder(folder) {
        const shouldNotRemove = /(\.idea)|(\.DS_Store)|(\.git)/i;

        fse.ensureDirSync(folder);
        fs.readdirSync(folder).forEach((filename) => {
          if (!shouldNotRemove.test('/' + filename + '/')) {
            try {
              fse.removeSync(path.join(folder, filename));
            } catch(err) {

            }
          }
        });
    },

    writeFileSync(filePath, content) {

        fse.ensureFileSync(filePath);

        if (fs.existsSync(filePath)) {
            mode = 'r';
        }

        const fd = fs.openSync(filePath, mode);
        fs.writeFileSync(filePath, content);
        fs.close(fd);
        this.utime(filePath);
    },

    copyPageFromThemeTemplate(srcFolder, targetFolder) {

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
            this.utime(filePath);
        });

    }
};

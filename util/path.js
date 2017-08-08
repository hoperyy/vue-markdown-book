const relative = require('relative');
const path = require('path');

module.exports = {

    relative,

    themeFolder: path.join(__dirname, '../theme'),

    codeFolder: path.join(__dirname, '../temp'),

    getNameFromPath(filePath) {
        return filePath.replace(/\/$/, '').split('/').pop();
    },

    // /xx/x
    getFormatedRelativePath(folderPath, absolutePath) {
        let relativePath = absolutePath.replace(folderPath, '').replace(/\/$/, '');

        if (!/\//.test(relativePath)) {
            relativePath = '/' + relativePath;
        }

        return relativePath;
    }
};

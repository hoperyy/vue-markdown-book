const relative = require('relative');

module.exports = {

    relative,

    getNameFromPath(filePath) {
        return filePath.replace(/\/$/, '').split('/').pop();
    }
};

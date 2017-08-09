
const configUtil = require('./config');

module.exports = {

    // two parts: 1. shouldNotShow 2. shouldNotCopyToCopiedDoc
    checkShouldNotShow(rootFolder, absoluteFilePath) {

        // formate relativeFilePath
        const userConfig = configUtil.mergeUserConfig(rootFolder, absoluteFilePath);

        const relativeFilePath = absoluteFilePath.replace(rootFolder);

        if (configUtil._shouldNotShowReg.test(relativeFilePath)) {
            return true;
        }

        if (configUtil._shouldNotPutInCopiedFolder.test(relativeFilePath)) {
            return true;
        }

        // user config
        if (userConfig.shouldNotShowReg && userConfig.shouldNotShowReg.test(relativeFilePath)) {
            return true;
        }

        return false;
    }
};

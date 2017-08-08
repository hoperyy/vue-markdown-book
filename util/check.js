
const configUtil = require('./config');

module.exports = {
    checkShouldNotShow(rootFolder, absoluteFilePath) {

        // formate relativeFilePath
        const userConfig = configUtil.mergeUserConfig(rootFolder, absoluteFilePath);

        const relativeFilePath = absoluteFilePath.replace(rootFolder);

        // default config
        if (userConfig._shouldNotShowReg.test(relativeFilePath)) {
            return true;
        }

        // user config
        if (userConfig.shouldNotShowReg && userConfig.shouldNotShowReg.test(relativeFilePath)) {
            return true;
        }

        return false;
    }
};

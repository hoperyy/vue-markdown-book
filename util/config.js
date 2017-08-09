
const path = require('path');
const fs = require('fs');

const defaultUserConfig = {
    theme: 'default',
    iframeTheme: 'iframe-default',
    _shouldNotShowReg: /((\.staging)|(\.bookrc)|(node\_modules)|(book\-themes)|(package\.json)|(package-lock\.json)|(\.git)|(\.idea)|(\.ds_store))/i,
    shouldNotShowExtnameReg: null
};

const getConfigInFolder = (folder) => {

    // merge user config
    const userConfigFilePath = path.join(folder, '.bookrc');

    if (!fs.existsSync(userConfigFilePath)) {
        return null;
    }

    const config = require(userConfigFilePath);

    let userConfig;

    if (typeof config === 'function') {
        userConfig = config();
    } else {
        userConfig = config;
    }

    return userConfig;
};

module.exports = {

    defaultShouldNotShowReg: defaultUserConfig._shouldNotShowReg,

    mergeUserConfig(rootFolder, absoluteFilePath) {

        let relativeFilePath = absoluteFilePath.replace(rootFolder, '');
        relativeFilePath = relativeFilePath.replace(/^\//, '').replace(/\/$/, '');

        const tempArr = relativeFilePath.split('/');

        const dirArr = [];

        // [xx/xx/xx/xx, xx/xx/xx, /xx/xx, /xx]
        while(tempArr.length) {
            const currentFilePath = path.join(rootFolder, tempArr.join('/'));

            if (fs.statSync(currentFilePath).isDirectory()) {
                dirArr.push(currentFilePath);
            }

            tempArr.pop();
        }

        dirArr.unshift(rootFolder);

        let config = {};
        for (let i in defaultUserConfig) {
            config[i] = defaultUserConfig[i];
        }
        for (let i = dirArr.length - 1; i >= 0; i--) {
            const currentConfig = getConfigInFolder(dirArr[i]);
            if (currentConfig) {
                for (let i in currentConfig) {
                    config[i] = currentConfig[i];
                }
            }
        }


        return config;
    }
};

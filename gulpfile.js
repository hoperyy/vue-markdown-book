
const fs = require('fs');
const path = require('path');
const gulp = require('gulp');

const fse = require('fs-extra');

const isRelative = require('is-relative');

const processer = require('./handler/single-page');

const cacheFolder = path.join(process.env.HOME, '.v2u2eb2ook');
const scaffoldFolder = path.join(cacheFolder, 'scaffold');

// prepare
require('./util/file').copySync(path.join(__dirname, 'postcss.config.js'), path.join(scaffoldFolder, 'postcss.config.js'));

const getArgv = () => {
    const params = {};
    const argv = process.argv;
    for (let i = argv.length - 1; i >= 0; i--) {
        if (/\=/.test(argv[i])) {
            const arr = argv[i].split('=');
            params[arr[0]] = arr[1];
        }
    }

    return params;
};

const { cwd, task } = getArgv();

const getUserConfig = (cwd) => {
    const configFilePath = path.join(cwd, '.bookrc');

    if (!fs.existsSync(configFilePath)) {
        return null;
    }

    let obj = require(configFilePath);

    return obj;
};

const run = currentEnv => {

    const userConfig = getUserConfig(cwd);

    let urlRoot = (userConfig && userConfig.root && userConfig.root) || '';

    if (urlRoot === '/') {
        urlRoot = '';
    }

    if (urlRoot && !/^\//.test(urlRoot)) {
        urlRoot = '/' + urlRoot;
    }

    const isDev = /dev\-/.test(currentEnv);

    let buildFolder = path.join(cwd, 'build');

    if (userConfig && userConfig.buildDir) {
        if (isRelative(userConfig.buildDir)) {
            buildFolder = path.join(cwd, userConfig.buildDir);
        } else {
            buildFolder = userConfig.buildDir;
        }
    }

    const config = {
        userFolder: cwd,
        buildFolder,
        codeFolder: path.join(scaffoldFolder, 'vuebook-temp-code'),
        currentEnv: currentEnv,
        urlRoot,
        pagePath: {
            index: '/index.html',
            iframe: '/iframe.html'
        },
        replace(currentFolder) {
            return {
                '$$_CDNURL_$$': {
                    'dev-daily': `${urlRoot}/static`,
                    'dev-pre': `${urlRoot}/static`,
                    'dev-prod': `${urlRoot}/static`,
                    'build-daily': `${urlRoot}/static`,
                    'build-pre': `${urlRoot}/static`,
                    'build-prod': `${urlRoot}/static`
                }
            };
        }
    };

    if (isDev) {
        config.debugPort = 9000;
    }

    processer(config);
};

const tasks = {

    dev() {
        run('dev-prod');
    },

    build() {
        run('build-prod');
    }
};

tasks[task]();

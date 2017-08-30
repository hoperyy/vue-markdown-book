
const fs = require('fs');
const path = require('path');
const gulp = require('gulp');

const fse = require('fs-extra');

const isRelative = require('is-relative');

const syncDirectory = require('sync-directory');

const processer = require('./handler/single-page');

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

const syncScaffold = (scaffoldFolder) => {
    const nmPath = path.join(scaffoldFolder, 'node_modules');

    syncDirectory(__dirname, scaffoldFolder, {
        ignored: /node\_modules/i
    });

    if (fs.existsSync(nmPath)) {
        fse.removeSync(nmPath);
    }

    if (fs.existsSync(path.join(__dirname, 'node_modules'))) {
        fse.ensureSymlinkSync(path.join(__dirname, 'node_modules'), nmPath);
    }

    // if vue markdown book is in node_modules
    if (path.join(__dirname, '../').replace(/\/$/, '').split('/').pop() === 'node_modules') {
        fse.ensureSymlinkSync(path.join(__dirname, '..'), path.join(scaffoldFolder, '../node_modules'));
    }

};

const syncDoc = (from, to, {watch}) => {
    syncDirectory(from, to, {
        watch: watch
    });
};

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

    let urlRoot = userConfig.root && userConfig.root || '';

    if (urlRoot === '/') {
        urlRoot = '';
    }

    if (urlRoot && !/^\//.test(urlRoot)) {
        urlRoot = '/' + urlRoot;
    }

    const isDev = /dev\-/.test(currentEnv);

    const cacheFolder = path.join(process.env.HOME, '.v2u2eb2ook');

    const scaffoldFolder = path.join(cacheFolder, 'scaffold');

    const docFolder = path.join(scaffoldFolder, 'workspace', encodeURIComponent(cwd), cwd.replace(/\/$/, '').split('/').pop());

    // sync scaffold
    syncScaffold(scaffoldFolder);

    syncDoc(cwd, docFolder, { watch: isDev });

    let buildFolder = path.join(cwd, 'build');

    if (userConfig && userConfig.buildDir) {
        if (isRelative(userConfig.buildDir)) {
            buildFolder = path.join(cwd, userConfig.buildDir);
        } else {
            buildFolder = userConfig.buildDir;
        }
    }

    const config = {
        docFolder,
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

        console.log('preparing...');

        run('dev-prod');
    },

    build() {

        console.log('preparing...');

        run('build-prod');
    }
};

tasks[task]();

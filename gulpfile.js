
const fs = require('fs');
const path = require('path');
const gulp = require('gulp');

const fse = require('fs-extra');

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
    } else {
        fse.ensureSymlinkSync(path.join(__dirname, '..'), nmPath);
    }


};

const syncDoc = (from, to, {watch}) => {
    syncDirectory(from, to, {
        watch: watch
    });
};

const run = currentEnv => {

    const urlRoot = '/vue-markdown-book';

    const isDev = /dev\-/.test(currentEnv);

    const cacheFolder = path.join(process.env.HOME, '.v2u2eb2ook');

    const scaffoldFolder = path.join(cacheFolder, 'scaffold');

    const docFolder = path.join(scaffoldFolder, 'workspace', encodeURIComponent(cwd), cwd.replace(/\/$/, '').split('/').pop());

    // sync scaffold
    syncScaffold(scaffoldFolder);

    syncDoc(cwd, docFolder, { watch: isDev });

    const config = {
        docFolder,
        buildFolder: path.join(cwd, 'build'),
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

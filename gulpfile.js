
const fs = require('fs');
const path = require('path');
const gulp = require('gulp');

const fse = require('fs-extra');

const syncDirectory = require('sync-directory');

// const processer = require('./handler/multi-page');
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
    if (fs.existsSync(nmPath)) {
        fse.removeSync(nmPath);
    }
    syncDirectory(__dirname, scaffoldFolder, {
        ignored: /node\_modules/i
    });
    if (fs.existsSync(nmPath)) {
        fse.removeSync(nmPath);
    }
    fse.ensureSymlinkSync(path.join(__dirname, 'node_modules'), nmPath);
};

const syncDoc = (from, to) => {
    syncDirectory(from, to, {
        watch: true
    });
};

const tasks = {

    dev() {

        const cacheFolder = path.join(process.env.HOME, '.v2u2eb2ook');

        const scaffoldFolder = path.join(cacheFolder, 'scaffold');

        const docFolder = path.join(scaffoldFolder, 'workspace', encodeURIComponent(cwd), cwd.replace(/\/$/, '').split('/').pop());

        // sync scaffold
        syncScaffold(scaffoldFolder);

        syncDoc(cwd, docFolder);

        processer({
            docFolder,
            buildFolder: path.join(cwd, 'build'),
            codeFolder: path.join(scaffoldFolder, 'vuebook-temp-code'),
            debugPort: 9000,
            currentEnv: 'dev-prod'
        });
    },

    build() {

        const fse = require('fs-extra');
        const tempCodeFolder = path.join(process.env.HOME, '.vuebook/vuebook-temp-code');

        const from = path.join(__dirname, 'node_modules');
        const to = path.join(tempCodeFolder, 'node_modules');
        if (fs.existsSync(to)) {
            fse.removeSync(to);
        }
        fse.ensureSymlinkSync(from, to);

        processer({
            docFolder: cwd,
            buildFolder: path.join(cwd, 'build'),
            codeFolder: tempCodeFolder,
            currentEnv: 'build-prod'
        });
    }
};

tasks[task]();

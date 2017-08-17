
const fs = require('fs');
const path = require('path');
const gulp = require('gulp');

let processer;

if (false) {
    processer = require('./handler/multi-page');
} else {
    processer = require('./handler/single-page');
}

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

const params = getArgv();

const tasks = {};

tasks['dev'] = () => {

    const fse = require('fs-extra');
    const tempCodeFolder = path.join(process.env.HOME, '.vuebook/vuebook-temp-code');

    const from = path.join(__dirname, 'node_modules');
    const to = path.join(tempCodeFolder, 'node_modules');
    if (fs.existsSync(to)) {
        fse.removeSync(to);
    }
    fse.ensureSymlinkSync(from, to);

    processer({
        docFolder: params.cwd,
        buildFolder: path.join(params.cwd, 'build'),
        codeFolder: tempCodeFolder,
        debugPort: 9000,
        currentEnv: 'dev-prod'
    });
};

tasks['build'] = () => {

    const fse = require('fs-extra');
    const tempCodeFolder = path.join(process.env.HOME, '.vuebook/vuebook-temp-code');

    const from = path.join(__dirname, 'node_modules');
    const to = path.join(tempCodeFolder, 'node_modules');
    if (fs.existsSync(to)) {
        fse.removeSync(to);
    }
    fse.ensureSymlinkSync(from, to);

    processer({
        docFolder: params.cwd,
        buildFolder: path.join(params.cwd, 'build'),
        codeFolder: tempCodeFolder,
        currentEnv: 'build-prod'
    });
};

tasks[params.task]();

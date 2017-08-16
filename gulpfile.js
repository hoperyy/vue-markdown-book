
const path = require('path');
const gulp = require('gulp');

let processer;

if (true) {
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
    const fileUtil = require('./util/file');
    const tempCodeFolder = path.join(process.env.HOME, '.vuebook/vuebook-temp-code');

    fileUtil.writeFileSync(path.join(tempCodeFolder, 'package.json'), JSON.stringify({
        name: "temp-code",
        version: "0.0.1"
    }));

    require('child_process').execSync(`cd ${tempCodeFolder} && npm i babel-preset-es2015 autoprefixer`);

    fileUtil.copySync(path.join(__dirname, '.babelrc'), path.join(tempCodeFolder, '.babelrc'));
    fileUtil.copySync(path.join(__dirname, 'postcss.config.js'), path.join(tempCodeFolder, 'postcss.config.js'));

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
    const fileUtil = require('./util/file');
    const tempCodeFolder = path.join(process.env.HOME, '.vuebook/vuebook-temp-code');

    fileUtil.writeFileSync(path.join(tempCodeFolder, 'package.json'), JSON.stringify({
        name: "temp-code",
        version: "0.0.1"
    }));

    require('child_process').execSync(`cd ${tempCodeFolder} && npm i babel-preset-es2015 autoprefixer`);

    fileUtil.copySync(path.join(__dirname, '.babelrc'), path.join(tempCodeFolder, '.babelrc'));
    fileUtil.copySync(path.join(__dirname, 'postcss.config.js'), path.join(tempCodeFolder, 'postcss.config.js'));

    processer({
        docFolder: params.cwd,
        buildFolder: path.join(params.cwd, 'build'),
        codeFolder: tempCodeFolder,
        currentEnv: 'build-prod'
    });
};

tasks[params.task]();

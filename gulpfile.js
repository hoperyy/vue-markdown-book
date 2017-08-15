
const path = require('path');
const gulp = require('gulp');

let processer;

if (false) {
    processer = require('./handler/multi-page');
} else {
    processer = require('./handler/single-page');
}

gulp.task('dev', () => {

    console.log(process.env.HOME);
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

    console.log(process.cwd());

    processer({
        docFolder: '/Users/lyy/Downloads/code/my-project/docs', // process.cwd(),
        buildFolder: path.join('/Users/lyy/Downloads/code/my-project/docs', 'build'),
        codeFolder: tempCodeFolder,
        debugPort: 9000,
        currentEnv: 'dev-prod'
    });
});

gulp.task('build', () => {

    const tempCodeFolder = path.join(__dirname, './temp');

    processer({
        docFolder: path.join(__dirname, 'docs'),
        buildFolder: path.join(__dirname, 'build'),
        codeFolder: tempCodeFolder,
        currentEnv: 'build-prod'
    });
});

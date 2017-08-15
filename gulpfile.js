
const path = require('path');
const gulp = require('gulp');

let processer;

if (false) {
    processer = require('./handler/multi-page');
} else {
    processer = require('./handler/single-page');
}

gulp.task('dev', () => {
    processer({
        docFolder: path.join(__dirname, 'docs'),
        buildFolder: path.join(__dirname, 'build'),
        codeFolder: path.join(__dirname, './temp'),
        debugPort: 9000,
        currentEnv: 'dev-prod'
    });
});

gulp.task('build', () => {
    processer({
        docFolder: path.join(__dirname, 'docs'),
        buildFolder: path.join(__dirname, 'build'),
        codeFolder: path.join(__dirname, './temp'),
        currentEnv: 'build-prod'
    });
});

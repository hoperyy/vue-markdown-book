#!/usr/bin/env node

/**
 * Created by liuyuanyangscript@gmail.com on 2017/08/15.
 */

'use strict';
require('colors');

const commander = require('commander');
const fs = require('fs');
const path = require('path');
const fse = require('fs-extra');

commander
    .command('init')
    .description('初始化.')
    .parse(process.argv)
    .action(() => {
        const from = path.join(__dirname, '../demo');
        const to = process.cwd();

        let isEmpty = true;
        fs.readdirSync(to).forEach((filename) => {
            if (/(\.DS_Store)|(\.idea)|(\.git)|(\.bookrc)|(node\_modules)|(build)/i.test(filename)) {
                return;
            }

            isEmpty = false;
        });

        if (isEmpty) {
            fse.copySync(from, to);
            console.log('\nCreating demo files succeed!\n');
        } else {
            console.log('\nSkip creating demo files because there are files in current directory\n');
        }

    });

commander
    .command('dev')
    .description('启动.')
    .parse(process.argv)
    .action(() => {
        const gulpfile = path.join(__dirname, '../gulpfile.js');
        const cwd = process.cwd();
        require('child_process').execSync(`node ${gulpfile} task=dev cwd=${cwd}`, {
            cwd: path.join(__dirname, '..'),
            stdio: 'inherit'
        });
    });

commander
    .command('build')
    .description('build.')
    .parse(process.argv)
    .action(() => {
        const gulpfile = path.join(__dirname, '../gulpfile.js');
        const cwd = process.cwd();
        require('child_process').execSync(`node ${gulpfile} task=build cwd=${cwd}`, {
            cwd: path.join(__dirname, '..'),
            stdio: 'inherit'
        });
    });


commander.parse(process.argv);

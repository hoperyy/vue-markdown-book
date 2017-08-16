#!/usr/bin/env node

/**
 * Created by liuyuanyangscript@gmail.com on 2017/08/15.
 */

'use strict';
require('colors');

const commander = require('commander');
const fs = require('fs');
const path = require('path');

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

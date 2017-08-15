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
        require('child_process').execSync('npm run dev', {
            cwd: path.join(__dirname, '..'),
            stdio: 'inherit'
        });
    });


commander.parse(process.argv);

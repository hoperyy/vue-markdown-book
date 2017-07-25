#!/usr/bin/env node

/*!
 * liuyuanyangscript@gmail.com
 */
'use strict';
require('colors');

const commander = require('commander');
const co = require('co');
const fs = require('fs');
const path = require('path');

commander
    .command('dev')
    .description('local dev.')
    .parse(process.argv)
    .action(() => {
        require('child_process').fork(path.join(__dirname, '../entry.js'), [process.cwd(), 'dev']);
    });

commander.parse(process.argv);

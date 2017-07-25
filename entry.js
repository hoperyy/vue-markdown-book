
const gulpfile = require('./gulpfile');

const currentEnv = process.argv.pop();
const docFolder = process.argv.pop();

gulpfile({
  docFolder: docFolder,
  currentEnv: currentEnv
});

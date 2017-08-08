const git = require('git-rev-sync');

module.exports = {
    getGitVersion(folder) {

        try {
            let version = git.branch(folder);
            version = version.indexOf('publish/') > -1 ? version.replace(/publish\//,'') : '0.0.0';
            return version;
        } catch(err) {

            // 不报错
            return '0.0.0';
        }

    }
};

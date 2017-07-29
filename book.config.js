module.exports = () => {

    const config = {

        // build folder
        buildFolder: require('path').join(__dirname, '../vue-markdown-book-ghpages'),

        // theme
        theme: 'vdian-h5-doc',

        // user name
        userName: 'xxx',

        // ignore files
        ignored: /assets/i

    };

    return config;
};

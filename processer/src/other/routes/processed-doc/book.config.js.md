```js
module.exports = () => {

    const config = {

        // build folder
        buildFolder: require('path').join(__dirname, '../vue-markdown-book-ghpages'),

        // theme
        theme: 'vdian-iframe',

        // user name
        userName: 'xxx',

        // ignore files
        ignored: /assets2/i

    };

    return config;
};
```
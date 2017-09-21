## Introductions

+   It is a command cli.
+   It will process markdown files into website.
+   You can write vue code in markdown file, and also npm package is supported.
+   It will display content directly when touching file type which is not markdown.

## demo

[https://hoperyy.github.io/vue-markdown-book/index.html#/index](https://hoperyy.github.io/vue-markdown-book/index.html#/index)

## debug

+   `[sudo] npm i vue-markdown-book -g`
+   `mkdir doc`
+   `cd doc`
+   `vuebook init`
+   `vuebook dev`
+   [http:127.0.0.1:9000/index.html#/index](http:127.0.0.1:9000/index.html#/index)

## build

+   `vuebook build`

## user config

+   `.bookrc`

    ```
    module.exports = {

        // {RegExp}; Files which should not be shown; null by default
        shouldNotShowReg: /(inserted)/i, 

        // {RegExp}; File extname which should not be shown; null by default
        shouldNotShowExtnameReg: /(\.md)/i,

        // {String}; page theme; 'default' by default
        theme: 'h5-doc',

        // {String}; iframe page theme; 'iframe-default' by default
        iframeTheme: 'iframe-default',

        // {Array}; sort menu; dir or filename is supported
        sort: [ 'detail.md', 'index.md', 'index.html' ],

        // {String}; static root path used in html file; '/' by default
        // for example, if 'staticPath' is '/', this static source path in index.html will be '<script src="/static/common.js"></script>'
        // for example, if 'staticPath' is '/vue-markdown-book', this static source path in index.html will be '<script src="/vue-markdown-book/static/common.js"></script>'
        // for example, if 'staticPath' is '/test', this static source path in index.html will be '<script src="/test/static/common.js"></script>'
        staticPath: '/vue-markdown-book'

    };
    ```

+   New Pogrammer

    `<iframe-doc src="xxx"></iframe-doc>`

    It will insert an iframe page, whose attribute `src` should link `.vue` or `.md` file, such as `<iframe-doc src="./test.vue"></iframe-doc>`.



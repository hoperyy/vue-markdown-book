## Introductions

+   It is a command cli.
+   It will process markdown file into website.
+   You can write vue code in markdown file, and also npm package is supported.
+   It will display content directly when touching file type which is not markdown.

## demo

[https://hoperyy.github.io/vue-markdown-book/index.html#/test](https://hoperyy.github.io/vue-markdown-book/index.html#/test)

## debug

+   `[sudo] npm i vue-markdown-book -g`
+   `mkdir doc`
+   `cd doc`
+   `vuebook init`
+   `vuebook dev`
+   [http:127.0.0.1:9000/index.html](http:127.0.0.1:9000/index.html)

## build

+   `vuebook build`

## user config

+   `.bookrc`

    ```
    module.exports = {
        shouldNotShowReg: /(assets)/i, // File path which matches this RegExp will not be shown
        shouldNotShowExtnameReg: /(\.md)/i, // File extname which matches this RegExp will not be shown
        theme: 'default', // Website theme ('default' by default)
        iframeTheme: 'iframe-default', // Iframe page theme（'iframe-default' by default）
        sort: [ 'b.md', 'a.md' ], // sort menu, Those two files will be in front.
        root: '/' // static root path when build, like: <script src="/static/index.js"></script>
    };
    ```

+   code themes
    +   `cd book-themes`
    +   coding...

+   New Pogrammer

    `<iframe-doc src="xxx"></iframe-doc>`

    It will insert an iframe page, whose attribute `src` should link `.vue` or `.md` file, such as `<iframe-doc src="./test.vue"></iframe-doc>`.



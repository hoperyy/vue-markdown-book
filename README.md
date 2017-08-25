**En**

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
        iframeTheme: 'iframe-default' // Iframe page theme（'iframe-default' by default）
    };
    ```

+   code themes
    +   `cd book-themes`
    +   coding...

+   New Pogrammer

    `<iframe-doc src="xxx"></iframe-doc>`

    It will insert an iframe page, whose attribute `src` should link `.vue` or `.md` file, such as `<iframe-doc src="./test.vue"></iframe-doc>`.



---

**中文**

## 简介

+   这是一个命令行工具
+   该工具会将 markdown 文件编译为可访问的网页
+   支持 markdown 文档内编写 vue 代码，可以在文章中写各种 demo，并且可以使用第三方 npm 包
+   非 markdown 格式的文件，直接展示文件内容

有项目需要写文档的话，可以考虑这个工具

## 演示页面

[https://hoperyy.github.io/vue-markdown-book/index.html#/test](https://hoperyy.github.io/vue-markdown-book/index.html#/test)

## 调试

+   `[sudo] npm i vue-markdown-book -g`
+   `mkdir doc`
+   `cd doc`
+   `vuebook init`
+   `vuebook dev`
+   打开 [http:127.0.0.1:9000/index.html](http:127.0.0.1:9000/index.html)

## 生成 build

+   `vuebook build`

## 个性化配置

+   个性化配置文件 `.bookrc`

    ```
    module.exports = {
        shouldNotShowReg: /(assets)/i, // 设置不显示在页面的文件
        shouldNotShowExtnameReg: /(\.md)/i, // 设置不显示的文件后缀
        theme: 'default', // 选择主题（默认是 default）
        iframeTheme: 'iframe-default' // 选择 iframe 页面的主题（默认是 iframe-default）
    };
    ```

+   自定义主题
    +   `cd book-themes`
    +   编辑主题页面代码，主题页面参考 `book-themes/` 下的文件目录

+   内置语法

    `<iframe-doc src="xxx"></iframe-doc>`

    嵌入 iframe 页面，属性 `src` 值为 `.vue` 或 `.md` 文件，例：`<iframe-doc src="./test.vue"></iframe-doc>`

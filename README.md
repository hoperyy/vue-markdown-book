## 简介

+   这是一个命令行工具
+   该工具会将 markdown 文件编译为可访问的网页
+   支持 markdown 文档内编写 vue 代码，可以在文章中写各种 demo，并且可以使用第三方 npm 包
+   非 markdown 格式的文件，直接展示文件内容

有项目需要写文档的话，可以考虑这个工具

## 使用

+   `git clone git@github.com:hoperyy/vue-markdown-book.git`
+   `npm link` (生成全局命令 `vuebook`，可能需要加 `sudo`)
+   进入另一个目录
+   `mkdir doc`
+   `cd doc`
+   `vuebook init`
+   `vuebook dev`
+   打开 [http:127.0.0.1:9000/doc.html](http:127.0.0.1:9000/doc.html)

## 个性化配置

+   个性化配置文件 `.bookrc`

    ```
    module.exports = {
        shouldNotShowReg: /(assets)/i, // 设置不显示在页面的文件
        shouldNotShowExtnameReg: /(\.md)/i, // 设置不显示的文件后缀
        theme: 'default', // 选择主题（默认是 default）
        iframeTheme: 'iframe-default' // 选择 iframe 页面的主题（默认是 default-iframe）
    };
    ```

+   自定义主题
    +   `cd book-themes`
    +   编辑主题页面代码，主题页面参考 `book-themes/` 下的文件目录

+   内置语法

    `<iframe-doc src="xxx"></iframe-doc>`

    嵌入 iframe 页面，属性 `src` 值为 `.vue` 或 `.md` 文件，例：`<iframe-doc src="./test.vue"></iframe-doc>`

    

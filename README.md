## 简介

+   这是一个命令行工具
+   该工具会将 markdown 文件编译为可访问的网页
+   支持 markdown 文档内编写 vue 代码，可以在文章中写各种 demo，并且可以使用第三方 npm 包
+   非 markdown 格式的文件，直接展示文件内容

有项目需要写文档的话，可以考虑这个工具

## 使用

+   `mkdir doc`
+   `cd doc`
+   编辑文件内容
+   `vuebook dev`
+   打开 [http:127.0.0.1:9000/doc.html](http:127.0.0.1:9000/doc.html)

## 个性化配置

+   个性化配置文件 `.bookrc`

    ```
    module.exports = {
        shouldNotShowReg: /(assets)/i, // 设置不显示在页面的文件
        shouldNotShowExtnameReg: /(\.md)/i, // 设置不显示的文件后缀
        theme: 'default', // 选择主题（默认是 default）
        iframeTheme: 'default-iframe' // 选择 iframe 页面的主题（默认是 default-iframe）
    };
    ```

+   自定义主题
    +   `cd doc`
    +   `mkdir book-themes`
    +   编辑主题页面代码，主题页面参考 `./theme/` 下的文件目录

+   todo

    +   默认主题美化

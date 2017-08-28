
这是该电子书的 default 主题

## 主题必须存在的文件是：

+  `./file-tree.js`

    这个文件提供了文档的目录结构，供导航等组件使用

+   `./routes.js`

    这个文件提供了基于文档目录结构生成的路由信息，生成路由使用

+   `./routes-template/`

    这个目录提供了页面访问到某路由时的页面结构，分别为 `file-template.vue` 和 `dir-template.vue`。

    顾名思义，就是如果访问的路由是文件，页面结构是 `file-template.vue` 确定的，如果访问的路由是目录，页面结构是 `dir-template.vue`

## index.html 中有关键词，是什么意思

+   `$$_CDNURL_$$` 静态资源路径，在开发和发布环境不同（本案例适配 github pages 的路径）

# 这是一个 markdown 文件

+ 可以写 markdown

  就像这个列表项一样

+ 可以用 markdown 语法插入图片，但图片路径不要有中文

  ![img](./assets/markdown-img-paste-20170726194904174.png)

+ 可以随时插入前端代码

  <div>
  这是一个 div
  </div>

  <style scoped>
  div {
    background: black;
    text-align: center;
    color: white;
  }
  </style>

+ 可以插入 iframe

  <iframe src="/8ac86a50c931407f250f2eb930549785.html#/6b9e3ccc4c2540859f5cf4dd73989206"></iframe>

+ 可以随时插入 vue 编写的 demo

<test>test</test>

<script>
import test from './test.vue';

export default {
  components: {
    test
  },
  data() {
    return {
      show: true
    }
  }
}
</script>
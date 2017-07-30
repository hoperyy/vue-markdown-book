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

  <iframe src="/other.html#/demo"></iframe>

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

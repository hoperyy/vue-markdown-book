# 这是一个 markdown 文件

+ 可以写 markdown

  就像这个列表项一样

+ 可以用 markdown 语法插入图片，但图片路径不要有中文

![img](./assets/markdown-img-paste-20170817210743612.png)

+ 可以随时插入 vue 编写的 demo

<imported-vue class="test">test</imported-vue>

<style lang="less" scoped>
.test {
  background: black;
  text-align: center;
  color: white;
}
</style>

<script>
import ImportedVue from './imported-vue.vue';

export default {
  components: {
    'imported-vue': ImportedVue
  }
}
</script>

+ 可以插入 iframe

<iframe-doc src="./iframe.vue"></iframe-doc>

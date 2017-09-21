# This is a markdown file

+ insert vue demo

<inserted-vue class="test">test</inserted-vue>

<style lang="less" scoped>
.test {
  background: black;
  text-align: center;
  color: white;
}
</style>

<script>
import InsertedVue from './inserted/inserted-vue-demo.vue';

export default {
  components: {
    InsertedVue
  }
}
</script>

+ insert an image

  ![img](./inserted/inserted-img-demo.png)
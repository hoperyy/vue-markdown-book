<template>
    <div>
      <sidebar :arr="arr"></sidebar>
    </div>
</template>

<script>

import Vue from 'vue';
import fileTree from '../dynamic-files/file-tree';

Vue.component('sidebar', {
    props: [
        'arr'
    ],
    template: `
      <ul>
          <li v-for="(item, index) in arr">
              <div>{{item.path}}</div>
              <sidebar v-if="item.children" :arr="item.children"></sidebar>
          </li>
      </ul>
    `
});

export default {
    components: {

    },
    data() {
        return {
          arr: fileTree.children
        };
    }
};

</script>

<style lang="less">
</style>

<template>
    <div>
      <sidebar :arr="arr"></sidebar>
    </div>
</template>

<script>

import Vue from 'vue';
import fileTree from '../dynamic-files/file-tree';

Vue.component('sidebar', {
    props: ['arr'],
    template: `
      <div>
          <ul>
              一级
              <li v-for="(item, index) in arr">
                  <div @click="click">{{item.path}}</div>
              </li>
          </ul>
          <ul>
              二级
              <li v-for="(item, index) in arr">
                  <ul>
                      <li v-if="item.children" v-for="(level2Item, level2Index) in item.children">
                          <div @click="click">{{level2Item.path}}</div>
                      </li>
                  </ul>
              </li>
          </ul>
          <ul>
              三级
              <li v-for="(item, index) in arr">
                  <ul v-if="item.children && item.children.length">
                      <li v-for="(level2Item, level2Index) in item.children">
                          <ul v-if="level2Item.children && level2Item.children.length">
                              <li v-for="(level3Item, level3Index) in level2Item.children">
                                  <div @click="click">{{level3Item.path}}</div>
                              </li>
                          </ul>
                      </li>
                  </ul>
              </li>
          </ul>
      </div>
    `,
    methods: {
        click() {

        }
    },
});

export default {
    data() {
        return {
          arr: fileTree.children
        };
    }
};

</script>

<style lang="less">

</style>

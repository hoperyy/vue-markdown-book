<template>
    <div>
      <Level1Nav :currentIndex="[level1Index]" v-model="level1Index" :arr="arr"></Level1Nav>
      <Level2Nav :currentIndex="[level1Index, level2Index]" v-model="level2Index" :arr="arr"></Level2Nav>
      <Level3Nav :currentIndex="[level1Index, level2Index, level3Index]" v-model="level3Index" :arr="arr"></Level3Nav>
    </div>
</template>

<script>

import fileTree from '../dynamic-files/file-tree';
import Level1Nav from './Level1Nav.vue';
import Level2Nav from './Level2Nav.vue';
import Level3Nav from './Level3Nav.vue';

export default {
    components: {
        Level1Nav,
        Level2Nav,
        Level3Nav
    },
    data() {
        return {
          arr: fileTree.children,
          level1Index: '',
          level2Index: '',
          level3Index: ''
        };
    }
};

</script>

<style lang="less" scoped>

</style>

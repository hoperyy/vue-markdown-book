<template>
    <div>
      <Level1Nav :arr="arr"></Level1Nav>
      <Level2Nav :arr="arr"></Level2Nav>
      <Level3Nav :arr="arr"></Level3Nav>
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
          arr: fileTree.children
        };
    }
};

</script>

<style lang="less" scoped>

</style>

<template>
    <ul class="level1">
        <li @click="click(level1Index)" v-bind:class="getLevel1Class(level1Item, level1Index, withBorder = true)" v-for="(level1Item, level1Index) in arr">
            <div v-if="level1Item.type === 'directory'">{{level1Item.path.split('/').pop()}}</div>
            <router-link :to="level1Item.routePath" v-if="level1Item.type !== 'directory'">{{level1Item.path.split('/').pop()}}</router-link>
        </li>
    </ul>
</template>

<script>

export default {
    props: ['arr', 'value', 'currentIndex'],
    methods: {
      click(index) {
        this.$emit('input', index);
      },
      getLevel1Class(level1Item, level1Index) {
        return {
          'level1-item': true,
          'is-folder': level1Item.type === 'directory',
          'is-file': level1Item.type === 'file',
          'current': this.currentIndex + '' === level1Index + ''
        };
      }
    }
};

</script>

<style lang="less" scoped>
@import "./nav.less";
</style>

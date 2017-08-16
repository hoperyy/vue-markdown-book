<template>
    <ul class="level1">
        <li v-bind:class="getLevel1Class(level1Item, level1Index)" v-for="(level1Item, level1Index) in arr">
            <ul class="level2">
                <li @click="click(level2Index)" v-bind:class="getLevel2Class(level2Item, level2Index, level1Index)" v-if="level1Item.children" v-for="(level2Item, level2Index) in level1Item.children">
                  <div v-if="level2Item.type === 'directory'">{{level2Item.routerPath.split('/').pop()}}</div>
                  <router-link :to="level2Item.routerPath" v-if="level2Item.type !== 'directory'">{{level2Item.routerPath.split('/').pop()}}</router-link>
                </li>
            </ul>
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
        'current': this.currentIndex[0] + '' === level1Index + ''
      };
    },
    getLevel2Class(level2Item, level2Index, level1Index) {
      return {
        'level2-item': true,
        'is-folder': level2Item.type === 'directory',
        'is-file': level2Item.type === 'file',
        'current': [this.currentIndex[0], this.currentIndex[1]].join('-') === [level1Index, level2Index].join('-')
      };
    }
  }
};

</script>

<style lang="less" scoped>
@import "./nav.less";

.level1-item {
  display: none;

  &.current {
    display: block;
  }
}



</style>

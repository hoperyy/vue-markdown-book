<template>
    <ul class="level1">
        <li v-if="!level1Item.shouldNotShow" v-bind:class="getLevel1Class(level1Item, level1Index)" v-for="(level1Item, level1Index) in arr">
            <ul class="level2" v-if="level1Item.children">
                <li v-if="!level2Item.shouldNotShow" v-bind:class="getLevel2Class(level2Item, level2Index, level1Index)" v-for="(level2Item, level2Index) in level1Item.children">
                    <ul class="level3" v-if="level2Item.children">
                        <li v-if="!level3Item.shouldNotShow" @click="click(level3Index)" v-bind:class="getLevel3Class(level3Item, level3Index, level2Index, level1Index)" v-for="(level3Item, level3Index) in level2Item.children">
                          <div v-if="level3Item.type === 'directory'">{{level3Item.path.split('/').pop()}}</div>
                          <router-link :to="level3Item.path" v-if="level3Item.type !== 'directory'">{{level3Item.path.split('/').pop()}}</router-link>
                        </li>
                    </ul>
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
          current: this.currentIndex[0] + '' === level1Index + ''
        };
      },
      getLevel2Class(level2Item, level2Index, level1Index) {
        return {
          'level2-item': true,
          current: [this.currentIndex[0], this.currentIndex[1]].join('-') === [level1Index, level2Index].join('-')
        };
      },
      getLevel3Class(level3Item, level3Index, level2Index, level1Index) {
        return {
          'level3-item': true,
          'is-folder': level3Item.type === 'directory',
          'is-file': level3Item.type === 'file',
          current: [this.currentIndex[0], this.currentIndex[1], this.currentIndex[2]].join('-')  === [level1Index, level2Index, level3Index].join('-')
        };
      }
    }
};

</script>

<style lang="less" scoped>

@import "./nav.less";

.level1-item,
.level2-item {
  display: none;

  &.current {
    display: block;
  }
}

</style>

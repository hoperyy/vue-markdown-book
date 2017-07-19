<template>
    <ul v-bind:class="{'level1': true, 'has-border': hasBorder}">
        <li v-bind:class="getLevel1Class(level1Item, level1Index)" v-for="(level1Item, level1Index) in arr">
            <ul class="level2">
                <li @click="click(level2Index)" v-bind:class="getLevel2Class(level2Item, level2Index, level1Index)" v-if="level1Item.children" v-for="(level2Item, level2Index) in level1Item.children">
                  <div ref="level2-folder" v-if="level2Item.type === 'directory'">{{level2Item.path.split('/').pop()}}</div>
                  <router-link ref="level2-link" :to="level2Item.routePath" v-if="level2Item.type !== 'directory'">{{level2Item.path.split('/').pop()}}</router-link>
                </li>
            </ul>
        </li>
    </ul>
</template>

<script>

export default {
  props: ['arr', 'value', 'currentIndex'],
  watch: {
      currentIndex: function(data) {
        const dom1 = this.$refs['level2-folder'];
        const dom2 = this.$refs['level2-link'];
        if ( (dom1 && dom1.length) || (dom2 && dom2.length) ) {
          this.hasBorder = true;
        }
      }
  },
  data() {
    return {
      hasBorder: false
    };
  },
  mounted() {
    const dom1 = this.$refs['level2-folder'];
    const dom2 = this.$refs['level2-link'];
    if ( (dom1 && dom1.length) || (dom2 && dom2.length) ) {
      this.hasBorder = true;
    }
  },
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

<template>
    <ul class="level1">
        <li v-bind:class="getLevel1Class(level1Item, level1Index)" v-for="(level1Item, level1Index) in arr">
            <ul class="level2">
                <li @click="click(level2Index)" v-bind:class="getLevel2Class(level2Item, level2Index, level1Index)" v-if="level1Item.children" v-for="(level2Item, level2Index) in level1Item.children">
                    <div>{{level2Item.path.split('/').pop()}}</div>
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
          console.log('level2Nav: ', data);
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
        'current': [this.currentIndex[0], this.currentIndex[1]].join('-') === [level1Index, level2Index].join('-')
      };
    }
  }
};

</script>

<style lang="less" scoped>
ul, li {
    margin: 0;
    padding: 0;
    list-style: none;
}
.is-folder {
  background: orange;
}
.level1-item {
  display: none;

  &.current {
    display: block;
  }
}
.level1 {
  float: left;
}

.level2-item {
  &.current {
    border: 1px solid red;
  }
}

.level3 {
}
</style>

<template>
    <ul class="level1">
        <li v-bind:class="getLevel1Class(level1Item, level1Index)" v-for="(level1Item, level1Index) in arr">
            <ul class="level2" v-if="level1Item.children">
                <li v-bind:class="getLevel2Class(level2Item, level2Index, level1Index)" v-for="(level2Item, level2Index) in level1Item.children">
                    <ul class="level3" v-if="level2Item.children">
                        <li @click="click(level3Index)" v-bind:class="getLevel3Class(level3Item, level3Index, level2Index, level1Index)" v-for="(level3Item, level3Index) in level2Item.children">
                            <div>{{level3Item.path.split('/').pop()}}</div>
                        </li>
                    </ul>
                </li>
            </ul>
        </li>
    </ul>
</template>

<script>

export default {
    data: function() {
        return {};
    },
    props: ['arr', 'value', 'currentIndex'],
    watch: {
        currentIndex: function(data) {
            console.log('level3Nav: ', data);
        }
    },
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
          current: [this.currentIndex[0], this.currentIndex[0]].join('-') === [level1Index, level2Index].join('-')
        };
      },
      getLevel3Class(level3Item, level3Index, level2Index, level1Index) {
        console.log([this.currentIndex[0], this.currentIndex[1], this.currentIndex[2]].join('-'), [level1Index, level2Index, level3Index].join('-'));
        return {
          'level3-item': true,
          'is-folder': level3Item.type === 'directory',
          current: [this.currentIndex[0], this.currentIndex[1], this.currentIndex[2]].join('-')  === [level1Index, level2Index, level3Index].join('-')
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
.level1-item,
.level2-item {
  display: none;

  &.current {
    display: block;
  }
}

.level3-item {

  &.current {
    border: 1px solid black;
  }
}
.level1 {
  float: left;
}
.level2 {
}
.level3 {
}
</style>

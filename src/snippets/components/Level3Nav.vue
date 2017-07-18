<template>
    <ul class="level1">
        <li v-bind:class="getLevel1Class(level1Item, level1Index)" v-for="(level1Item, level1Index) in arr">
            <ul class="level2" v-if="level1Item.children">
                <li v-bind:class="getLevel2Class(level2Item, level2Index)" v-for="(level2Item, level2Index) in level1Item.children">
                    <ul class="level3" v-if="level2Item.children">
                        <li @click="click(level3Index)" v-bind:class="getLevel3Class(level3Item, level3Index)" v-for="(level3Item, level3Index) in level2Item.children">
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
          'level1-item': true
        };
      },
      getLevel2Class(level2Item, level2Index) {
        return {
          'level2-item': true
        };
      },
      getLevel3Class(level3Item, level3Index) {
        return {
          'level3-item': true,
          'is-folder': level3Item.type === 'directory'
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
.level1 {
  float: left;
  padding: 10px;
  border: 1px solid black;
}
.level2 {
  padding: 10px;
  border: 1px solid black;
}
.level3 {
  padding: 10px;
  border: 1px solid black;
}
</style>

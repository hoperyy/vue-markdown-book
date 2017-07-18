<template>
    <ul class="level1">
        <li @click="click(level1Index)" v-bind:class="getLevel1Class(level1Item, level1Index)" v-for="(level1Item, level1Index) in arr">
            <div>{{level1Item.path.split('/').pop()}}</div>
        </li>
    </ul>
</template>

<script>

export default {
    props: ['arr', 'value', 'currentIndex'],
    watch: {
        currentIndex(data) {
            console.log('level1Nav: ', data);
        }
    },
    methods: {
      click(index) {
        this.$emit('input', index);
      },
      getLevel1Class(level1Item, level1Index) {
        return {
          'level1-item': true,
          'is-folder': level1Item.type === 'directory',
          'current': this.currentIndex + '' === level1Index + ''
        };
      }
    },
    data() {
      return {}
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

.current {
    border: 1px solid red;
}

.level1 {
  float: left;
  padding: 10px;
  border: 1px solid black;
}
</style>

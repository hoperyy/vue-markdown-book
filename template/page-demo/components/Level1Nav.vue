<template>
    <ul v-bind:class="{'level1': true, 'has-border': hasBorder}">
        <li @click="click(level1Index)" v-bind:class="getLevel1Class(level1Item, level1Index, withBorder = true)" v-for="(level1Item, level1Index) in arr">
            <div ref="level1-folder" v-if="level1Item.type === 'directory'">{{level1Item.path.split('/').pop()}}</div>
            <router-link ref="level1-link" :to="level1Item.routePath" v-if="level1Item.type !== 'directory'">{{level1Item.path.split('/').pop()}}</router-link>
        </li>
    </ul>
</template>

<script>

export default {
    props: ['arr', 'value', 'currentIndex'],
    watch: {
        currentIndex: function(data) {
          const dom1 = this.$refs['level1-folder'];
          const dom2 = this.$refs['level1-link'];
          if ( (dom1 && dom1.length) || (dom2 && dom2.length) ) {
            this.hasBorder = true;
          }
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
          'is-file': level1Item.type === 'file',
          'current': this.currentIndex + '' === level1Index + ''
        };
      }
    },
    data() {
      return {
        hasBorder: false
      };
    },
    mounted() {
      const dom1 = this.$refs['level1-folder'];
      const dom2 = this.$refs['level1-link'];
      if ( (dom1 && dom1.length) || (dom2 && dom2.length) ) {
        this.hasBorder = true;
      }
    }
};

</script>

<style lang="less" scoped>
@import "./nav.less";
</style>

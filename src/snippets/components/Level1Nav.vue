<template>
    <ul class="level1">
        <li @click="click(index)" v-bind:class="{'level1-item': true, 'is-folder': level1Item.type === 'directory'}" v-for="(level1Item, index) in arr">
            <div>{{level1Item.path.split('/').pop()}}</div>
        </li>
    </ul>
</template>

<script>

export default {
    props: ['arr'],
    methods: {
      click(index) {
        console.log(index);
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
</style>

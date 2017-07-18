<template>
    <ul class="level1">
        <li class="level1-item" v-for="(item, index) in arr">
            <ul class="level2">
                <li @click="click(level2Index)" v-bind:class="{'level2-item': true, 'is-folder': level2Item.type === 'directory'}" v-if="item.children" v-for="(level2Item, level2Index) in item.children">
                    <div>{{level2Item.path.split('/').pop()}}</div>
                </li>
            </ul>
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

.level2 {
  padding: 10px;
  border: 1px solid black;
}

.level3 {
  padding: 10px;
  border: 1px solid black;
}
</style>

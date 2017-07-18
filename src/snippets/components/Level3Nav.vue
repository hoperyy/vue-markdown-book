<template>
    <ul class="level1">
        <li class="level1-item" v-for="(item, index) in arr">
            <ul class="level2" v-if="item.children">
                <li class="level2-item" v-for="(level2Item, level2Index) in item.children">
                    <ul class="level3" v-if="level2Item.children">
                        <li v-bind:class="{'level3-item': true, 'is-folder': level3Item.type === 'directory'}" v-for="(level3Item, level3Index) in level2Item.children">
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
    props: ['arr'],
    data: function() {
        return {};
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

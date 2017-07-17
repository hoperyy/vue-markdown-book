<template>
    <ul class="level1">
        <li class="level1-item" v-for="(item, index) in arr">
            <ul class="level2" v-if="item.children">
                <li class="level2-item" v-for="(level2Item, level2Index) in item.children">
                    <ul class="level3" v-if="level2Item.children">
                        <li class="level3-item" v-for="(level3Item, level3Index) in level2Item.children">
                            <div>{{level3Item.path}}</div>
                        </li>
                    </ul>
                </li>
            </ul>
        </li>
    </ul>
</template>

<script>

export default {
    props: ['arr']
};

</script>

<style lang="less" scoped>
ul, li {
    margin: 0;
    padding: 0;
    list-style: none;
}
.level1 {
  float: left;
  padding: 10px;
  border: 1px solid black;
}
</style>

<template>
    <ul class="level1">
        <li class="level1-item" v-for="(item, index) in arr">
            <ul class="level2">
                <li class="level2-item" v-if="item.children" v-for="(level2Item, level2Index) in item.children">
                    <div>{{level2Item.path}}</div>
                </li>
            </ul>
        </li>
    </ul>
</template>

<script>

export default {
    components: {
    },
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

.level2 {
  padding: 10px;
  border: 1px solid black;
}

.level3 {
  padding: 10px;
  border: 1px solid black;
}
</style>

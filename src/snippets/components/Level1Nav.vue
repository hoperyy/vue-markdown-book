<template>
    <ul class="level1">
        <li class="level1-item" v-for="(item, index) in arr">
            <div>{{item.path}}</div>
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

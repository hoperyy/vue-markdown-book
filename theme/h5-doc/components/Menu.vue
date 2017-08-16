<template>
    <div class="theme-h5-doc-menu">
        <ul class="level1">
            <li v-bind:class="getClass('level1-item', level1Item)" v-for="(level1Item, level1Index) in fileTree">
                <span v-if="level1Item.type === 'directory'">{{level1Item.routerPath.split('/').pop()}}</span>
                <router-link :to="level1Item.routerPath" v-else>{{level1Item.routerPath.split('/').pop()}}</router-link>
                <ul class="level2" v-if="level1Item.children">
                    <li v-bind:class="getClass('level2-item', level2Item)" v-for="(level2Item, level2Index) in level1Item.children">
                        <div v-if="level2Item.type === 'directory'">{{level2Item.routerPath.split('/').pop()}}</div>
                        <router-link :to="level2Item.routerPath" v-else>{{level2Item.routerPath.split('/').pop()}}</router-link>
                        <ul class="level3" v-if="level2Item.children">
                            <li v-bind:class="getClass('level3-item', level3Item)" v-for="(level3Item, level3Index) in level2Item.children">
                                <div v-if="level3Item.type === 'directory'">{{level3Item.routerPath.split('/').pop()}}</div>
                                <router-link :to="level3Item.routerPath" v-else>{{level3Item.routerPath.split('/').pop()}}</router-link>
                                <ul class="level3" v-if="level2Item.children">
                                    <li v-bind:class="getClass('level4-item', level4Item)" v-for="(level4Item, level4Index) in level3Item.children">
                                        <div v-if="level4Item.type === 'directory'">{{level4Item.routerPath.split('/').pop()}}</div>
                                        <router-link :to="level4Item.routerPath" v-else>{{level4Item.routerPath.split('/').pop()}}</router-link>
                                    </li>
                                </ul>
                            </li>
                        </ul>
                    </li>
                </ul>
            </li>
        </ul>
    </div>
</template>

<script>

import fileTree from '../file-tree';

export default {
    props: ['currentIndex'],
    methods: {
        getClass(levelClass, levelItem) {

            const classObj = {
                'is-folder': levelItem.type === 'directory',
                'is-file': levelItem.type === 'file',
                'current': this.currentIndex.join('-') === levelItem.index + ''
            };

            classObj[levelClass] = true;

          return classObj;
        }
    },
    data() {

        return {
            fileTree: fileTree.children
        };
    }
};

</script>

<style lang="less" scoped>

ul,
li {
    list-style: none;
    margin: 0;
    padding: 0;
}

ul {
    padding-left: 5px;
}

.is-file >:first-child,
.is-folder >:first-child {
    display: block;
    text-decoration: none;
    color: inherit;
    height: 18px;
    line-height: 18px;
    font-weight: 700;
    padding: 8px;
    display: block;
}

.is-file >:first-child {
    color: #4c555a;
    font-weight: normal;
}

.is-folder >:first-child {
    color: #9da5b3;
}

.current >:first-child {
    color: red;
}
</style>

<template>
    <div>
        <Mheader></Mheader>
        <md></md>
        <Mfooter></Mfooter>
    </div>
</template>

<script>

import Mheader from '../../components/Header.vue';
import Mfooter from '../../components/Footer.vue'

import md from './articals/index.md';

export default {
    components: {
        Mheader,
        Mfooter,
        md
    },
    data() {
        return {
            message: 'Hello World'
        };
    }
};

</script>

<style lang="less">
</style>

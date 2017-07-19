<template>
    <div>
        <Mheader></Mheader>
        <Mmenu></Mmenu>
        <Mfooter></Mfooter>
    </div>
</template>

<script>

import Mheader from '../../components/Header.vue';
import Mfooter from '../../components/Footer.vue';
import Mmenu from '../components/Menu.vue'

export default {
    components: {
        Mheader,
        Mfooter,
        Mmenu
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

<template>
    <div>
        <Mheader></Mheader>
        <Mfooter></Mfooter>
    </div>
</template>

<script>

import Mheader from '../../components/Header.vue';
import Mfooter from '../../components/Footer.vue'

export default {
    components: {
        Mheader,
        Mfooter,
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

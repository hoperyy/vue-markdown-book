
<template>
    <div class="hoper-body">
        <Mheader></Mheader>
        <div class="hoper-content">
            <Mmenu :currentIndex="['0']"></Mmenu>
            <div class="hoper-doc">
            </div>
        </div>
        <Mfooter></Mfooter>
    </div>
</template>

<script>
import Mheader from '../../components/Header.vue';
import Mfooter from '../../components/Footer.vue';
import Mmenu from '../components/Menu.vue';

export default {
    components: {
        Mheader,
        Mfooter,
        Mmenu
    }
};

</script>

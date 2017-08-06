<template>
    <div class="theme-vdianh5doc-body">
        <Mheader></Mheader>
        <div class="theme-vdianh5doc-content">
            <Mmenu :currentIndex="['3']"></Mmenu>
            <div class="common-theme-markdown-doc theme-vdianh5doc-markdown-doc"></div>
        </div>
    </div>
</template>

<script>
import Mheader from '../components/common/Header.vue';
import Mfooter from '../components/common/Footer.vue';
import Mmenu from '../components/Menu.vue';

export default {
    components: {
        Mheader,
        Mfooter,
        Mmenu,
    }
};

</script>

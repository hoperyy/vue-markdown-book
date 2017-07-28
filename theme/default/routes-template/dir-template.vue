<template>
    <div class="theme-default-body">
        <Mheader></Mheader>
        <div class="theme-default-content">
            <Mmenu :currentIndex=$$_FILE_INDEX_$$></Mmenu>
            <div class="common-theme-markdown-doc theme-default-markdown-doc"></div>
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

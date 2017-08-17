
<template>
    <div class="theme-h5-doc-body">
        <div class="theme-h5-doc-content">
            <Mmenu :currentIndex="['0']"></Mmenu>
            <div class="common-theme-markdown-doc theme-h5-doc-markdown-doc"></div>
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
        Mmenu
    }
};

</script>

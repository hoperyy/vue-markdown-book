<template>
    <div class="theme-h5-doc-body">
        <div class="theme-h5-doc-content">
            <Mmenu :currentIndex=$$_FILE_INDEX_$$></Mmenu>
            <div class="common-theme-markdown-doc theme-h5-doc-markdown-doc"></div>
        </div>
    </div>
</template>

<script>
import Mmenu from '../components/Menu.vue';

export default {
    components: {
        Mmenu
    }
};

</script>

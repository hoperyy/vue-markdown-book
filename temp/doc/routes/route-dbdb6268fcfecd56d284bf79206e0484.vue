<template>
    <div class="theme-vdianh5doc-body">
        <Mheader></Mheader>
        <div class="theme-vdianh5doc-content">
            <Mmenu :currentIndex="['2','0']"></Mmenu>
            <div class="common-theme-markdown-doc theme-vdianh5doc-markdown-doc">
                <Doc></Doc>
            </div>
        </div>
    </div>
</template>

<script>
import Mheader from '../components/common/Header.vue';
import Mfooter from '../components/common/Footer.vue';
import Mmenu from '../components/Menu.vue';

import Doc from "./copied-doc/assets/markdown-img-paste-2017080610192124.png.md";

export default {
    components: {
        Mheader,
        Mfooter,
        Mmenu,
        Doc
    }
};

</script>

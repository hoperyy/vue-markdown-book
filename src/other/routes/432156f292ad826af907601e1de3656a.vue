<template>
    <div class="theme-default-body">
        <div class="theme-default-content">
            <Mmenu :currentIndex="['0','0']"></Mmenu>
            <div class="common-theme-markdown-doc theme-default-markdown-doc">
                <Doc></Doc>
            </div>
        </div>
    </div>
</template>

<script>
import Mheader from '../components/common/Header.vue';
import Mfooter from '../components/common/Footer.vue';
import Mmenu from '../components/Menu.vue';

import Doc from "./processed-doc/assets/markdown-img-paste-20170726194904174.png.md";

export default {
    components: {
        Mheader,
        Mfooter,
        Mmenu,
        Doc
    }
};

</script>

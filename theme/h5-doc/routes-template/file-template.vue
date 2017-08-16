<template>
    <div class="theme-h5-doc-body">
        <div class="theme-h5-doc-content">
            <Mmenu :currentIndex=$$_FILE_INDEX_$$></Mmenu>
            <div class="common-theme-markdown-doc theme-h5-doc-markdown-doc">
                <Doc></Doc>
            </div>
        </div>
    </div>
</template>

<script>
import Mmenu from '../components/Menu.vue';

import Doc from $$_DOC_PATH_$$;

export default {
    components: {
        Mmenu,
        Doc
    }
};

</script>

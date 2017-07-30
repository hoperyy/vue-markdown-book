<template>
    <div class="theme-default-body">
        <div class="theme-default-content">
            <div class="common-theme-markdown-doc theme-default-markdown-doc">
                <Doc></Doc>
            </div>
        </div>
    </div>
</template>

<script>

import Doc from "./processed-doc/index.js.md";

export default {
    components: {
        Doc
    }
};

</script>

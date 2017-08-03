```vue
<template>
  <Overlay v-model="show"></Overlay>
</template>

<style lang="less" scoped>
div {
  background: black;
  text-align: center;
  color: white;
  padding: 10px 0;
}
</style>

<script>

import Overlay from '@vdian/h5-overlay';
import _ from 'underscore';

export default {
  data() {
      return {
          show: true
      }
  },
  components: {
      Overlay
  }
}
</script>
```
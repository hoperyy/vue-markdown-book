### Overlay

#### 遮罩层组件2

##### 用法一：使用 vue 标签（`<overlay></overlay>`）

+   属性

    参数  | 说明 | 类型 | 可选值 | 默认值
    ---- | ---- | ---- | ---- | ----
    v-model | 是否显示遮盖层 | Boolean | - | -
    absolute | 是否使用 `position: absolute`，默认是 `position: fixed` | Boolean | `true` / `fasle` | `false`
    hideWhenClick | 点击时是否关闭 overlay | Boolean | `true` / `fasle` | `false`

+   方法

    参数  | 说明 | 类型 | 可选值 | 默认值
    ---- | ---- | ---- | ---- | ----
    onClick | 点击后的回调，可使用 `@click` 事件监听 | Function | - | -

+   示例代码

    ```
    <template>
      <Overlay v-model="show" :absolute="absolute" :hideWhenClick="hideWhenClick" @click="onClick"></Overlay>
    </template>

    <script>

    import './src/less/hotpot.less';

    import Overlay from '@vdian/h5-overlay';

    export default {
        data() {
            return {
                show: true,
                absolute: false, // 默认值
                hideWhenClick: false // 默认值
            }
        },
        methods: {
            onClick() {
                this.show = false;
            }
        },
        components: {
            Overlay
        }
    }
    </script>

    <style lang="less" scoped>
    </style>
    ```

##### 用法二：使用 `prototype`（`import '@vdian/h5-overlay/prototype.js'`）

+   显示 Overlay：`this.$overlay.show(config)`

    `config`  | 说明 | 类型 | 可选值 | 默认值
    ---- | ---- | ---- | ---- | ----
    `config.absolute` | 是否使用 `position: absolute`，默认是 `position: fixed` | Boolean | `true` / `fasle` | `false`
    `config.hideWhenClick` | 点击时是否关闭 overlay | Boolean | `true` / `fasle` | `false`
    `config.onClick` | 点击后的回调，可使用 `@click` 事件监听 | Function | - | -

+   隐藏 Overlay：`this.$overlay.hide()`

+   示例代码

    ```
    <template>
      <div></div>
    </template>

    <script>

    import './src/less/hotpot.less';

    import '@vdian/h5-overlay/prototype';

    export default {
        mounted() {
            this.$overlay.show({
                absolute: false, // 默认
                hideWhenClick: false, // 默认
                onClick() {} // onClick 事件
            });

            setTimeout(() => {
                this.$overlay.hide();
            }, 3000);
        }
    }
    </script>

    <style lang="less" scoped>
    </style>
    ```

<iframe-doc src="./iframe-demos/Overlay.vue"></iframe-doc>

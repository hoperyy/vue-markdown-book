import './index.less';

import Vue from 'vue';
import VueRouter from 'vue-router';
import map from './map';

// 子页面
import Main from './routes/Index.vue';

// 初始化
Vue.use(VueRouter);

const router = new VueRouter({

    // 添加路由
    routes: [{
        path: '/',
        component: Main
    }].concat(map)
    // 添加路由结束

});

new Vue({
    router
}).$mount('#app');

import './index.less';

import Vue from 'vue';
import VueRouter from 'vue-router';
import routes from './shown-vue/routes';

// 子页面
import Main from './routes/Index.vue';

// 初始化
Vue.use(VueRouter);

const router = new VueRouter({

    // 添加路由
    routes: [{
        path: '/',
        component: Main
    }].concat(routes)
    // 添加路由结束

});

// router.beforeEach((to, from, next) => {
//   console.log('to: ', to);
//   console.log('from: ', from);
//   console.log('next: ', next);
// })

new Vue({
    router
}).$mount('#app');

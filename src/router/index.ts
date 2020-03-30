import Vue from 'vue';
import VueRouter from 'vue-router';

Vue.use(VueRouter);

const routes = [
  {
    path: '/global',
    name: 'CountriesVisualizer',
    component: () => import('@/views/CountriesVisualizer.vue')
  },
  {
    path: '/us',
    name: 'StatesVisualizer',
    component: () => import('../views/StatesVisualizer.vue')
  },
  {
    path: '/about',
    name: 'About',
    component: () => import('../views/About.vue')
  },
  {
    path: '*',
    redirect: '/global'
  }
];

const router = new VueRouter({
  mode: 'history',
  routes
});

export default router;

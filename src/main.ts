import Vue from 'vue';
import App from './App.vue';
import './registerServiceWorker';
import router from './router';
import store from './store';
import '@/components';
import 'vue-loaders/dist/vue-loaders.css';
import VueLoaders from 'vue-loaders';

Vue.config.productionTip = false;

Vue.use(VueLoaders);

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app');

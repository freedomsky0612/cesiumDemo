// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue';
import App from './App';
import router from './router';
// 初始化重置样式;
import '@/styles/reset.css';
// cesium样式;
import 'cesium/Widgets/widgets.css';
// 全局注册Cesium访问对象
let Cesium = require('cesium/Cesium');

Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIzMGI2ZjBhMy0wYzcxLTQ2OWUtYWMwNy0zNDlmOTIxMjE5NDciLCJpZCI6MjMxOTUsInNjb3BlcyI6WyJhc2wiLCJhc3IiLCJhc3ciLCJnYyJdLCJpYXQiOjE1ODQ1MjExNjJ9.TCYjuEFrlSIGD2R_8QB6-9qg4n-nWG3vWVse2BGMIrE';
Vue.prototype.Cesium = Cesium;


Vue.config.productionTip = false;
/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  components: { App },
  template: '<App/>'
})

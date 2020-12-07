import Vue from 'vue';
import "../styles/styles.scss";

import HomePage from './pages/home.vue';
const Home = Vue.extend(HomePage)

let homeApp = new Home({
    name: 'Music Connect Home',
    el: '#homeApp',
});
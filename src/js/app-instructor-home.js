import Vue from 'vue';
import "../styles/styles.scss";

import InstructorHomePage from './pages/instructor-home.vue';
const Classroom = Vue.extend(InstructorHomePage)

let instructorApp = new Classroom({
    name: 'Music Connect Classroom',
    el: '#instructorHomeApp',
});
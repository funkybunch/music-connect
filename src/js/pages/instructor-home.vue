<template>
  <div>
    <img src="../../img/music-connect.svg" alt="Music Connect Logo" style="margin-top:36px" />
    <h1 class="display">{{ profile.name }}&apos;s Classes</h1>
    <main>
      <section>
        <div class="card">
          <h2>My Classrooms</h2>
          <p>These are the classrooms you have created.  Click the link icon to copy the student link and share.  You may launch the classroom anytime to set things up.</p>
          <ul>
            <li v-for="classroom in classrooms"><a :href="'/i/' + classroom.classID">{{ classroom.class }}</a></li>
          </ul>
        </div>
      </section>
      <section>
        <div class="card">
          <h3>Need to create a new classroom?</h3>
          <button v-on:click="createClass" style="align-self:center;cursor:pointer;padding:12px 16px;background-color:#0250AE;border-radius:8px;font-weight:bold;color:white;border:none;">Create Classroom</button>
        </div>
      </section>
    </main>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: "classroom",
  data() {
    return {
      profile: {},
      classrooms: {},
    }
  },
  methods: {
    getProfile: function() {
      let self = this;
      axios
          .get('/api/profile/')
          .then(response => (self.profile = response.data))
    },
    getClasses: function() {
      let self = this;
      axios
          .get('/api/classes/')
          .then(response => (self.classrooms = response.data))
    },
    createClass: function() {
      let self = this;
      let time = Math.round((Math.random() * 4) + 1);
      let index = Math.round(Math.random() * 2);
      let subjects = [
          'General Music',
          'Music Theory',
          'Music History'
      ]
      axios
          .get('/api/create/?class=' + time + 'PM ' + subjects[index])
          .then(response => (self.classes = response.data))
          .then(function() {
            self.getClasses();
          });
    },
  },
  mounted() {
    this.getProfile();
    this.getClasses();
  }
}

</script>

<style scoped>

</style>
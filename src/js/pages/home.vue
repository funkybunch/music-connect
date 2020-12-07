<template>
  <div>
    <main class="home">
        <section class="card">
          <div>
            <img src="../../img/music-connect.svg" alt="Music Connect Logo"/>
          </div>
          <div v-if="!authenticated">
            <h1>Welcome Back!</h1>
            <p>Please sign in to continue.</p>
            <a href="/signin/" style="margin-top:24px;display:inline-block;">
              <img src="../../img/sign-in-with-google.svg" alt="Sign In With Google Button"/>
            </a>
          </div>
          <div v-else>
            <h1>Welcome {{ profile.name }}!</h1>
            <p style="margin-bottom: 16px;">Please use the join link provided to you to join a class.</p>
            <p style="margin-bottom: 16px;">If you are an instructor and looking for your classes, please check that you are signed in with the correct account.  Contact your administrator for further assistance.</p>
            <a v-if="Object.keys(profile).length === 0" href="/signin/" class="button secondary">Switch Account</a>
            <a v-else href="/signout/" class="button secondary">Sign Out</a>
          </div>
        </section>
    </main>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: "Home",
  data() {
    return {
      authenticated: false,
      profile: {}
    }
  },
  methods: {
    getProfile: function() {
      let self = this;
      axios
          .get('/api/profile/')
          .then(response => (self.profile = response.data))
          .then(response => (self.authenticated = true))
          .then(response => (self.instructorRedirect()))
          .catch(error => {
            self.authenticated = false;
          });
    },
    instructorRedirect(direct = false) {
      if(direct) {
        window.location.replace('/classes/');
      } else if(this.authenticated === true && this.profile.isInstructor === true) {
        window.location.replace('/classes/');
      }
    }
  },
  // watch: {
  //   authenticated: function(newVal) {
  //     if(newVal === true && this.profile.isInstructor === true) {
  //       this.instructorRedirect(true);
  //     }
  //   }
  // },
  mounted() {
    this.getProfile();
    let self = this;
    setTimeout(function() {
      self.getProfile();
    }, 1000);
  }
}
</script>

<style scoped>

</style>
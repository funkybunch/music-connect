<template>
  <div>
    <h1 class="display">Instructor View ({{ profile.name }})</h1>
    <h2>{{ classroom.class }} ({{ (classroom.open === true) ? 'Open' : 'Closed' }})</h2>
    <button v-if="classroom.open === true" v-on:click="closeClass">Close Classroom</button>
    <button v-if="classroom.open === false" v-on:click="openClass">Open Classroom</button>
    <main>
      <section>
        <h1>Messaging</h1>
        <ul id="messages">
          <li v-for="notification in notifications">{{ notification }}</li>
        </ul>
        <form action="" id="messaging">
          <input id="m" autocomplete="off" /><button>Send</button>
        </form>
      </section>
      <section>
        <h2>Media & WebRTC Communication</h2>
        <audio id="player" ref="player"></audio>
        <form action="">
          <button id="play" v-on:click.prevent="play(selectedFile)" v-if="status === 'stopped'">play</button>
          <button id="pause" v-on:click.prevent="pause" v-else-if="status === 'playing' || status === 'resumed'">pause</button>
          <button id="resume" v-on:click.prevent="resume" v-else-if="status === 'paused'">play</button>
          <button id="stop" v-on:click.prevent="stop">stop</button>
        </form>
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
      classroom: {},
      selectedFile: 0,
      filesLoaded: 0,
      status: 'stopped',
      notifications: []
    }
  },
  methods: {
    preloadAudio: function (url) {
      let audio = new Audio();
      // once this file loads, it will call loadedAudio()
      // the file will be kept by the browser as cache
      audio.addEventListener('canplaythrough', this.loadedAudio, false);
      audio.src = url;
    },
    loadedAudio: function () {
      // this will be called every time an audio file is loaded
      // we keep track of the loaded files vs the requested files
      this.filesLoaded++;
      if (this.filesLoaded === this.classroom.media.length) {
        // all have loaded
        this.sendNotification('All Media Files Have Been Pre-Loaded');
      }
    },
    play: function (index) {
      this.$refs.player.src = this.classroom.media[index].file;
      this.$refs.player.play();
      this.status = 'playing';
    },
    pause: function () {
      this.$refs.player.pause();
      this.status = 'paused';
    },
    resume: function () {
      this.$refs.player.play();
      this.status = 'resumed';
    },
    stop: function () {
      this.$refs.player.currentTime = this.$refs.player.duration;
      this.$refs.player.pause();
      this.status = 'stopped';
    },
    sendNotification: function(message) {
      this.notifications.push(message);
    },
    sendTestLog: function(message) {
      console.log(message);
    },
    getProfile: function() {
      let self = this;
      axios
          .get('/api/profile/')
          .then(response => (self.profile = response.data))
    },
    openClass: function() {
      let self = this;
      axios
          .get('/api/open/?classID=' + self.classroom.id);
      self.classroom.open = true;
    },
    closeClass: function() {
      let self = this;
      axios
          .get('/api/close/?classID=' + self.classroom.id);
      self.classroom.open = false;
    },
  },
  mounted() {
    this.getProfile();
  }
}

</script>

<style scoped>

</style>
<template>
  <div>
    <h1 class="display">Instructor View ({{ profile.name }})</h1>
    <h2>{{ classroom.class }} ({{ (classroom.open === true) ? 'Open' : 'Closed' }})</h2>
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
          <button id="play" v-on:click.prevent="play(0)" v-if="status === 'stopped'">play</button>
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
      audioFiles: [
        "http://10.134.5.9:3000/uploads/mixkit-raising-me-higher-34.mp3"
      ],
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
      if (this.filesLoaded === this.audioFiles.length) {
        // all have loaded
        this.sendNotification('All Media Files Have Been Pre-Loaded');
      }
    },
    play: function (index) {
      this.$refs.player.src = this.audioFiles[index];
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
    sendNotification(message) {
      this.notifications.push(message);
    },
    sendTestLog(message) {
      console.log(message);
    },
    getProfile() {
      axios
          .get('/api/profile/')
          .then(response => (this.profile = response.data))
    }
  },
  mounted() {
    this.getProfile();
    // we start preloading all the audio files
    for (let i in this.audioFiles) {
      this.preloadAudio(this.audioFiles[i]);
    }
  }
}

</script>

<style scoped>

</style>
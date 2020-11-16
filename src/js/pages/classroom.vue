<template>
  <div>
    <img src="../../img/music-connect.svg" alt="Music Connect Logo" style="margin-top:36px" />
    <h1 class="display">{{ classroom.class }}</h1>
    <h2>Taught by {{ classroom.teacher }}</h2>
    <main v-if="classroom.open === true">
      <section>
        <div class="card">
          <h3>Currently Playing</h3>
          <h4>{{ this.classroom.media[this.selectedFile].name }}</h4>
          <audio id="player" ref="player"></audio>
          <div style="position: relative;height:36px;margin-top: 16px;">
            <span style="position: absolute;width:100%;height:3px;top:2px;background-color:rgba(45, 175,0, .42);"></span>
            <span :style="'position: absolute;width:' + playerProgressPercentage + '%;height:3px;left:0;top:2px;background-color:rgba(45, 175,0, 1);'"></span>
            <span :style="'transition: all 500ms ease;position: absolute;width:14px;height:14px;border-radius:50%;top:-3px;background-color:#2DAF00;margin-left:-7px;left: ' + playerProgressPercentage + '%;'"></span>
            <span style="position: absolute;bottom:0;left:0;">{{ playerTimestamp }}</span>
            <span style="position: absolute;bottom:0;right:0;">{{ formatAsTime(fileDuration) }}</span>
          </div>
        </div>
      </section>
      <aside>
        <div class="card">
          <h3>{{ (connected === true) ? 'You Are Connected' : 'Disconnected' }}</h3>
          <p><span style="width:26px;height:26px;"></span></p>
        </div>
      </aside>
    </main>
    <main v-else>
      <section>
        <p>The instructor has not opened the class.  You will be automatically placed in the class when it starts.</p>
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
      connected: false,
      selectedFile: 0,
      fileDuration: 0,
      filesLoaded: 0,
      playerInitialized: false,
      playerProgressPercentage: 0,
      playerTimestamp: "0:00",
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
    loadedAudio: function() {
      // this will be called every time an audio file is loaded
      // we keep track of the loaded files vs the requested files
      this.filesLoaded++;
      if (this.filesLoaded === this.classroom.media.length) {
        // all have loaded
        this.sendNotification('All Media Files Have Been Pre-Loaded');
      }
    },
    formatAsTime(seconds) {
      let minutes = Math.floor(seconds / 60);
      let formattedSeconds = seconds - minutes * 60;
      let leading = '';
      if(formattedSeconds < 10) {
        leading = '0';
      }
      return minutes + ":" + leading + Math.round(formattedSeconds);
    },
    setSelectedFile: function(value) {
      this.selectedFile = value;
    },
    play: function() {
      this.$refs.player.src = this.classroom.media[this.selectedFile].file;
      this.$refs.player.play();
      this.playerInitialized = true;
      this.fileDuration = this.classroom.media[this.selectedFile].duration;
      console.log('time:', this.$refs.player.currentTime);
      console.log('duration:', this.classroom.media[this.selectedFile].duration);
      this.updateMarker();
    },
    pause: function() {
      this.$refs.player.pause();
    },
    resume: function() {
      this.$refs.player.play();
      this.updateMarker();
    },
    stop: function() {
      this.$refs.player.pause();
      this.$refs.player.currentTime = this.fileDuration;
      this.updateMarker(true);
    },
    sendNotification: function(message) {
      this.notifications.push(message);
    },
    sendTestLog: function(message) {
      if(message === 'Instructor Signal: connected via webRTC!') {
        this.connected = true;
      }
      console.log(message);
    },
    getProfile: function() {
      axios
          .get('/api/profile/')
          .then(response => (this.profile = response.data))
    },
    updateMarker: function(reset = false) {
      let self = this;
      if(!this.$refs.player.paused && !reset) {
        if(this.playerInitialized) {
          this.playerProgressPercentage = (this.$refs.player.currentTime / this.fileDuration) * 100;
          this.playerTimestamp = this.formatAsTime(this.$refs.player.currentTime);
        } else {
          this.playerProgressPercentage = 0;
          this.playerTimestamp = this.formatAsTime(0);
        }
        setTimeout(function() {
          self.updateMarker();
        }, 100);
      } else if(reset) {
        this.playerProgressPercentage = 0;
        this.playerTimestamp = this.formatAsTime(0);
      }
    }
  },
  mounted() {
    this.getProfile();
    // we start preloading all the audio files
    for (let i in this.classroom.media) {
      this.preloadAudio(this.classroom.media[i].file);
    }
  }
}

</script>

<style scoped>

</style>
<template>
  <div>
    <img src="../../img/music-connect.svg" alt="Music Connect Logo" style="margin-top:36px" />
    <h1 class="display">{{ classroom.class }}</h1>
    <h2>Taught by {{ classroom.teacher }}</h2>
    <main v-if="(classroom.open === true) && joined">
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
          <p style="display: flex;align-content: center;margin-top: 12px;margin-bottom: 12px;">
            <span style="display:inline-block;width:26px;height:26px;border-radius:50%;" :style="(connected === true) ? 'background-color:#2DAF00;' : 'background-color:#AF0000'"></span>
            <span style="margin-left: 16px;margin-top:4px">{{ (connected === true) ? 'Everything Looks Good!' : 'Trying to reconnect...' }}</span>
          </p>
          <label for="volumeSlider" style="font-weight: bold;margin-top:12px;">Volume</label>
          <input type="range" id="volumeSlider" min="0" max="100" v-model="volume" style="width: 100%;">
        </div>
      </aside>
    </main>
    <main v-else-if="(classroom.open === false) && joined">
      <section>
        <p>The instructor has not opened the class.  You will be automatically placed in the class when it starts.</p>
      </section>
    </main>
    <main v-else>
      <section>
        <h3>We&apos;re all set!</h3>
        <p>Join when you are ready</p>
        <button v-on:click="joinClass" style="align-self:center;cursor:pointer;padding:12px 16px;background-color:#0250AE;border-radius:8px;font-weight:bold;color:white;border:none;">Join Class</button>
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
      joined: false,
      classroom: {},
      connected: false,
      selectedFile: 0,
      fileDuration: 0,
      filesLoaded: 0,
      volume: 50,
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
      this.setVolume(this.volume);
      this.$refs.player.play();
      this.playerInitialized = true;
      this.fileDuration = this.classroom.media[this.selectedFile].duration;
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
    setVolume(level) {
      this.$refs.player.volume = (level/100);
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
    },
    joinClass: function() {
      this.joined = true;
    }
  },
  watch: {
    volume: function(newVal) {
      this.setVolume(newVal);
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
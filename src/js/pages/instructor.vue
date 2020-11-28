<template>
  <div>
    <img src="../../img/music-connect.svg" alt="Music Connect Logo" style="margin-top:36px" />
    <h1 class="display">{{ classroom.class }}</h1>
    <h2>Taught by {{ classroom.teacher }}</h2>
    <a href="/classes/" v-on:click="closeClass">Return to my classes</a>
    <main class="instructor">
      <section>
        <div class="card">
          <h2>Lesson Plan</h2>
          <p>These are the songs you have in today’s lesson plan.   You can also drag in new files to add them to the lesson plan.</p>
          <ul style="margin-top:12px;" v-if="(classroom.media) && (classroom.media.length > 0)">
            <li :class="(selectedFile === index) ? 'list-item selected' : 'list-item'" v-for="(media, index) in classroom.media">
              <a href="#" v-on:click.prevent="setSelectedFile(index)">
                <img v-if="(selectedFile === index) && (status === 'playing' || status === 'resumed')" src="../../img/list-playing.svg" aria-hidden="true"/>
                <img v-else-if="selectedFile === index" src="../../img/list-selected-playing.svg" aria-hidden="true"/>
                <img v-else src="../../img/list-queue.svg" aria-hidden="true"/>
                <h4>{{ media.name }}</h4>
              </a>
            </li>
          </ul>
          <div class="card callout embeded">
            <h3>Add Files To Your Lesson Plan</h3>
            <form id="upload-form" enctype="multipart/form-data">
              <input type="hidden" name="classID" :value="classroom.id">
              <input class="input-upload" ref="upload" name="media" type="file" accept=".mp3">
            </form>
            <button v-on:click="openUploadDiaglog" class="button primary">Upload New File</button>
          </div>
        </div>
      </section>
      <section>
        <div class="card">
          <h3>{{ classroom.attendees }} Students Connected</h3>
          <p style="display: flex;align-content: center;margin-top: 12px;margin-bottom: 12px;position: relative">
            <span style="display:inline-block;width:26px;height:26px;border-radius:50%;" :style="(classroom.open === true) ? 'background-color:#2DAF00;' : 'background-color:#AF0000'"></span>
            <span style="margin-left: 16px;margin-top:4px">{{ (classroom.open === true) ? 'Session available to students' : 'Offline - Session has not started' }}</span>
            <button v-if="classroom.open === true" v-on:click="closeClass" style="align-self:flex-end;cursor:pointer;padding:12px 16px;background-color:#AF0000;border-radius:8px;font-weight:bold;color:white;border:none;position:absolute;right:0;">End Session</button>
            <button v-if="classroom.open === false" v-on:click="openClass" style="align-self:flex-end;cursor:pointer;padding:12px 16px;background-color:#2DAF00;border-radius:8px;font-weight:bold;color:white;border:none;position:absolute;right:0;">Open Session</button>
          </p>
        </div>
        <div class="card">
          <h3>Currently Playing</h3>
          <h4 v-if="(classroom.media) && (classroom.media.length > 0)">{{ classroom.media[selectedFile].name }}</h4>
          <h4 v-else>No files loaded</h4>
          <audio id="player" ref="player"></audio>
          <div style="position: relative;height:36px;margin-top: 16px;">
            <span style="position: absolute;width:100%;height:3px;top:2px;background-color:rgba(45, 175,0, .42);"></span>
            <span :style="'position: absolute;width:' + playerProgressPercentage + '%;height:3px;left:0;top:2px;background-color:rgba(45, 175,0, 1);'"></span>
            <span :style="'transition: all 500ms ease;position: absolute;width:14px;height:14px;border-radius:50%;top:-3px;background-color:#2DAF00;margin-left:-7px;left: ' + playerProgressPercentage + '%;'"></span>
            <span style="position: absolute;bottom:0;left:0;">{{ playerTimestamp }}</span>
            <span style="position: absolute;bottom:0;right:0;">{{ formatAsTime(fileDuration) }}</span>
          </div>
          <div style="display: flex;justify-content: center;align-items: center;">
            <button style="opacity:0.4;border:none;cursor:pointer;width:46px;height:46px;border-radius:50%;background-color:#0092AF;margin-right:24px;" id="startover" aria-label="Start Over" disabled><img src="../../img/start-over.svg" aria-hidden="true"/></button>
            <button style="border:none;cursor:pointer;width:70px;height:70px;border-radius:50%;background-color:#2DAF00;" id="play" aria-label="Play" v-on:click.prevent="play()" v-if="status === 'stopped'"><img src="../../img/play.svg" style="margin-left:6px;" aria-hidden="true"/></button>
            <button style="border:none;cursor:pointer;width:70px;height:70px;border-radius:50%;background-color:#2DAF00;" id="pause" aria-label="Pause" v-on:click.prevent="pause" v-else-if="status === 'playing' || status === 'resumed'"><img src="../../img/pause.svg" aria-hidden="true"/></button>
            <button style="border:none;cursor:pointer;width:70px;height:70px;border-radius:50%;background-color:#2DAF00;" id="resume" aria-label="Play" v-on:click.prevent="resume" v-else-if="status === 'paused'"><img src="../../img/play.svg" style="margin-left:6px;" aria-hidden="true"/></button>
            <button style="border:none;cursor:pointer;width:46px;height:46px;border-radius:50%;background-color:#AF0000;margin-left:24px;" id="stop" aria-label="Stop" v-on:click.prevent="stop"><img src="../../img/stop.svg" aria-hidden="true"/></button>
          </div>
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
      uploadForm: null,
      profile: {},
      classroom: {},
      selectedFile: 0,
      filesLoaded: 0,
      volume: 50,
      playerInitialized: false,
      playerProgressPercentage: 0,
      playerTimestamp: "0:00",
      fileDuration: 0,
      status: 'stopped',
      notifications: []
    }
  },
  methods: {
    getClassInfo: function(run = 0) {
      let self = this;
      axios
          .get('/api/class/?classID=' + this.room)
          .then(response => (self.classroom = response.data))
          .then(function() {
            if(run === 0) {
              self.preloadMedia();
            }
          });
      setTimeout(function() {
        self.getClassInfo();
      }, 5000);
    },
    openUploadDiaglog: function() {
      this.$refs.upload.click();
    },
    uploadFile: function() {
      let formData = new FormData(this.uploadForm);
      let self = this;
      console.log(formData.get('media'));
      let file = formData.get('media');
      let fileReader = new FileReader();
      let duration = 0;
      fileReader.onload = function(e) {
        let tmpPlayer = new (window.AudioContext || window.webkitAudioContext)();
        tmpPlayer.decodeAudioData(e.target.result,
            function(buffer) {
              formData.append("duration", buffer.duration);
              axios({
                method  : 'post',
                url : '/api/upload/',
                data : formData,
                headers: {'Content-Type': 'multipart/form-data' }
              })
                  .then((res)=>{
                    self.getClassInfo();
                    self.resetUploadForm();
                  })
                  .catch((err) => {throw err});
            }
        )
      }
      fileReader.readAsArrayBuffer(file);
    },
    resetUploadForm: function() {
      this.uploadForm.reset();
    },
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
      if(this.status !== "stopped") {
        this.stop();
      }
      this.selectedFile = value;
    },
    play: function () {
      this.$refs.player.src = this.classroom.media[this.selectedFile].file;
      this.$refs.player.play();
      this.status = 'playing';
      this.playerInitialized = true;
      this.fileDuration = this.classroom.media[this.selectedFile].duration;
      this.updateMarker();
    },
    pause: function () {
      this.$refs.player.pause();
      this.status = 'paused';
    },
    resume: function () {
      this.$refs.player.play();
      this.status = 'resumed';
      this.updateMarker();
    },
    stop: function () {
      this.$refs.player.currentTime = this.$refs.player.duration;
      this.$refs.player.pause();
      this.status = 'stopped';
      this.updateMarker(true);
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
    }
  },
  watch: {
    volume: function(newVal) {
      this.setVolume(newVal);
    }
  },
  mounted() {
    this.getProfile();
    this.uploadForm = document.querySelector('#upload-form');
    let self = this;
    this.uploadForm.onchange = function(e) {
      console.log("change detected");
      self.uploadFile();
    };
  }
}

</script>

<style scoped>

</style>
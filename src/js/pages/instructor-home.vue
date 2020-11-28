<template>
  <div>
    <img src="../../img/music-connect.svg" alt="Music Connect Logo" style="margin-top:36px" />
    <h1 class="display">{{ profile.name }}&apos;s Classes</h1>
    <main class="instructor">
      <section>
        <div class="card">
          <h2 style="font-size: 36px">My Classrooms</h2>
          <p style="margin-bottom: 12px">These are the classrooms you have created.  Click the link icon to copy the student link and share.  You may launch the classroom anytime to set things up.</p>
          <ul>
            <li class="list-item" v-for="classroom in classrooms">
              <a :href="'/i/' + classroom.classID">
                <img src="../../img/go-to.svg">
                <h4>{{ classroom.class }}</h4>
              </a>
              <span class="list-action">
                <span v-if="copiedID === classroom.classID">Copied!</span>
                <a v-else href="#" v-on:click.prevent="copyClassLink(classroom.classID)" v-popover:clipboard.right>
                  <img src="../../img/link.svg" alt="Link Icon">
                </a>
              </span>
              <span class="list-action">
                <a href="#" v-on:click.prevent="setActiveClassContext(classroom.classID)" v-popover:utility.right>
                  <img src="../../img/context-menu.svg" alt="Link Icon">
                </a>
              </span>
            </li>
          </ul>
        </div>
        <popover
            name="utility"
            transition="show-from-right"
            event="click"
            :class="(hideContextMenu) ? 'hide' : ''"
            :pointer="false">
          <h5>Options</h5>
          <ul>
            <li>
              <a href="#" class="delete" v-on:click.prevent="deleteClass(activeClassContext)">
                <img src="../../img/trash.svg" alt="Delete Icon"> Delete
              </a>
            </li>
          </ul>
        </popover>
        <popover
            name="clipboard"
            transition="show-from-right"
            event="hover"
            :class="(hideCopyPopover) ? 'hide' : ''"
            :pointer="true">
          <p>Click to copy</p>
        </popover>
      </section>
      <section>
        <div class="card callout">
          <h3>Need to create a new classroom?</h3>
          <button v-on:click="toggleModal" class="button primary">Create Classroom</button>
        </div>
      </section>
      <div :class="(modalShow) ? 'modal open' : 'modal'">
        <div class="modal-content">
          <span class="close-btn" v-on:click="toggleModal"><img src="../../img/close.svg" alt="Close"></span>
          <h2 style="font-size: 32px;">New Classroom</h2>
          <p style="padding-bottom: 12px;">Tell us a bit more so we can set your classroom up for you.</p>
          <p>Make sure the class name is unique so you can tell it apart from your other classes.  This information will be visible to students.</p>
          <label for="className" style="font-size: 16px;margin-top:12px;display: block;font-weight: bold;">Name of Your Class</label>
          <input type="text" id="className" :class="(validationError) ? 'input-text error' : 'input-text'" name="className" v-model="newClass.name">
          <span v-if="validationError" style="font-size: 12px;color:#AF0000;font-weight:bold;">Please enter a name.</span>
          <p>Once your classroom is setup, you will be able to enter to setup your lesson plan.</p>
          <button v-on:click="toggleModal" class="button secondary">Cancel</button>
          <button v-on:click="createClass" class="button primary">Create</button>
        </div>
      </div>
    </main>
  </div>
</template>

<script>
import axios from 'axios';
import Vue from 'vue'
import VueClipboard from 'vue-clipboard2'
import VPopover from 'vue-js-popover'

Vue.use(VueClipboard)
Vue.use(VPopover, { tooltip: true })

export default {
  name: "classroom",
  data() {
    return {
      profile: {},
      classrooms: {},
      activeClassContext: "",
      modalShow: false,
      hideContextMenu: false,
      hideCopyPopover: false,
      validationError: false,
      copiedID: "",
      newClass: {
        name: ""
      }
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
    copyClassLink: function (classID) {
      let port = location.port;
      let url = "";
      if(port in ["0", "80", "443", ""]) {
        url = window.location.protocol + "//" + window.location.hostname + "/c/" + classID;
      } else {
        url = window.location.protocol + "//" + window.location.hostname + ":" + port + "/c/" + classID;
      }
      let self = this;
      this.$copyText(url).then(function (e) {
        // Copy Successful
        self.setCopyID(classID);
        setTimeout(function() {
          self.setCopyID("");
        }, 3000);
      }, function (e) {
        // Copy Unsuccessful
      })
    },
    setCopyID: function(id) {
      this.copiedID = id;
      this.hideCopyPopover = !(id === "");
    },
    createClass: function() {
      if(this.newClass.name === "") {
        this.validationError = true;
      } else {
        this.validationError = false;
        let self = this;
        axios
            .get('/api/create/?class=' + this.newClass.name)
            .then(response => (self.classes = response.data))
            .then(function() {
              self.newClass.name = "";
              self.getClasses();
              self.toggleModal();
            });
      }
    },
    deleteClass: function(classID) {
      let self = this;
      axios
          .get('/api/delete/?classID=' + classID)
          .then(function() {
            self.getClasses();
            self.hideContextMenu = true;
          });
    },
    toggleModal: function() {
      this.modalShow = !this.modalShow;
    },
    setActiveClassContext: function(classID) {
      this.hideContextMenu = false;
      this.activeClassContext = classID;
    }
  },
  mounted() {
    this.getProfile();
    this.getClasses();
  }
}

</script>

<style scoped>

</style>
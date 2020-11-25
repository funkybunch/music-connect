import Peer from 'peerjs';
import Vue from 'Vue';
let socket = io();

import ClassroomPage from './pages/classroom.vue';
import axios from "axios";
const Classroom = Vue.extend(ClassroomPage)

const room = window.location.pathname.split("/")[2];

let userID;
let peer = {
    initialValue: {},
    peerListener: function(val) {},
    set config(val) {
        this.initialValue = val;
        this.peerListener(val);
    },
    get config() {
        return this.initialValue;
    },
    registerListener: function(listener) {
        this.peerListener = listener;
    }
};
let connection = {
    initialValue: {},
    connListener: function(val) {},
    set config(val) {
        this.initialValue = val;
        this.connListener(val);
    },
    get config() {
        return this.initialValue;
    },
    registerListener: function(listener) {
        this.connListener = listener;
    }
};

socket.emit('join', room);

socket.on('user-id', function(uid){
    classroomApp.sendNotification('Assigned User ID: ' + uid);
    userID = uid;
    peer.config = new Peer(userID, {
        host: window.location.hostname,
        port: 9000,
        path: '/switchboard'
    })
});
socket.on('connect-id', function(cid){
    classroomApp.sendNotification('Connect ID ' + cid);
    connection.config = peer.config.connect(cid);
    console.log("attempting to connect to " + cid);
});

connection.registerListener(function(connection){
    classroomApp.sendNotification('WebRTC Connection Initialized');
    console.log('WebRTC Connection Initialized');
    connection.on('data', (data) => {
        classroomApp.sendTestLog('Instructor Signal: ' + data);
        if(data.startsWith("play ")) {
            classroomApp.setSelectedFile(parseInt(data.replace(/\D/g,'')));
            classroomApp.play();
        } else if(data === "pause") {
            classroomApp.pause();
        } else if(data === "resume") {
            classroomApp.resume();
        } else if(data === "stop") {
            classroomApp.stop();
        }
    });
});

let classroomApp = new Classroom({
    name: 'Music Connect Classroom',
    el: '#classroomApp',
    data() {
        return {
            room: room,
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
        preloadMedia: function() {
            // we start preloading all the audio files
            for (let i in this.classroom.media) {
                this.preloadAudio(this.classroom.media[i].file);
            }
        }
    },
    mounted() {
        this.getClassInfo();
    },
});
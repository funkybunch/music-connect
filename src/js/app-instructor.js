import Peer from 'peerjs';
import Vue from 'vue';
import "../styles/styles.scss";
let socket = io();

import InstructorPage from './pages/instructor.vue';
import axios from "axios";
const Classroom = Vue.extend(InstructorPage)
const port = (window.location.hostname === "localhost") ? 3000 : 443;

const room = window.location.pathname.split("/")[2];

let userID;

socket.emit('join', room);

socket.on('user-id', function(uid){
    instructorApp.sendNotification('Assigned User ID: ' + uid);
    userID = uid;
    instructorApp.$data.peer.config = new Peer(userID, {
        host: window.location.hostname,
        port: port,
        path: '/switchboard'
    })
});

function sendConnectionRequest() {
    socket.emit('connection request', 'connect');
}

let instructorApp = new Classroom({
    name: 'Music Connect Classroom',
    el: '#instructorApp',
    data() {
        return {
            room: room,
            peer: {
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
            },
            conns: []
        }
    },
    watch: {
        status: function(newVal, oldVal) {
            switch(newVal) {
                case "playing":
                    this.sendPlay();
                    break;
                case "paused":
                    this.sendPause();
                    break;
                case "resumed":
                    this.sendResume();
                    break;
                case "stopped":
                    this.sendStop();
                    break;
            }
        }
    },
    methods: {
        sendPlay: function() {
            sendConnectionRequest();
            this.sendTestLog('Sent: play ' + this.selectedFile);
            this.sendDataToConnections('play ' + this.selectedFile);
        },
        sendPause: function() {
            this.sendTestLog('Sent: pause');
            this.sendDataToConnections('pause');
        },
        sendResume: function() {
            this.sendTestLog('Sent: resume');
            this.sendDataToConnections('resume');
        },
        sendStop: function() {
            this.sendTestLog('Sent: stop');
            this.sendDataToConnections('stop');
            this.clearConnections();
        },
        getClassInfo: function(run = 0) {
            let self = this;
            self.clearConnections();
            axios
                .get('/api/class/?classID=' + self.room)
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
        preloadMedia() {
            // we start preloading all the audio files
            for (let i in this.classroom.media) {
                this.preloadAudio(this.classroom.media[i].file);
            }
        },
        sendDataToConnections(data) {
            for(let i = 0; i < this.conns.length; i++) {
                this.conns[i].send(data);
            }
        },
        clearConnections() {
            this.conns = [];
            sendConnectionRequest();
        }
    },
    mounted() {
        let self = this;
        this.getClassInfo();
        this.peer.registerListener(function(webRTC){
            self.sendNotification('WebRTC Connection Initialized');
            console.log('WebRTC Connection Initialized');
            webRTC.on('connection', function(conn) {
                self.conns.push(conn);
                self.sendNotification('WebRTC Connection Established With Student');
                conn.on('open', function(){
                    conn.send('connected via webRTC!');
                });
            });
        })
    },
});
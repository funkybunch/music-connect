import Peer from 'peerjs';
import Vue from 'Vue';
let socket = io();

import InstructorPage from './pages/instructor.vue';
import axios from "axios";
const Classroom = Vue.extend(InstructorPage)

const room = window.location.pathname.split("/")[2];

let userID;

socket.emit('join', room);

// $('form#messaging').submit(function(e) {
//     e.preventDefault(); // prevents page reloading
//     socket.emit('chat message', $('#m').val());
//     $('#m').val('');
//     return false;
// });

socket.on('user-id', function(uid){
    instructorApp.sendNotification('Assigned User ID: ' + uid);
    userID = uid;
    instructorApp.$data.peer.config = new Peer(userID, {
        host: window.location.hostname,
        port: 9000,
        path: '/'
    })
});

socket.on('chat message', function(msg){
    instructorApp.sendNotification(msg);
});

let instructorApp = new Classroom({
    name: 'Music Connect Classroom',
    el: '#instructorApp',
    data: {
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
        conn: null
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
            this.sendTestLog('Sent: play 1');
            this.conn.send('play 1');
        },
        sendPause: function() {
            this.sendTestLog('Sent: pause');
            this.conn.send('pause');
        },
        sendResume: function() {
            this.sendTestLog('Sent: resume');
            this.conn.send('resume');
        },
        sendStop: function() {
            this.sendTestLog('Sent: stop');
            this.conn.send('stop');
        },
        getClassInfo() {
            let self = this;
            axios
                .get('/api/class/?classID=' + this.room)
                .then(response => (this.classroom = response.data));
            setTimeout(function() {
                self.getClassInfo();
            }, 5000);
        }
    },
    mounted() {
        let self = this;
        this.getClassInfo();
        this.peer.registerListener(function(webRTC){
            self.sendNotification('WebRTC Connection Initialized');
            webRTC.on('connection', function(conn) {
                self.conn = conn;
                self.sendNotification('WebRTC Connection Established With Student');
                self.conn.on('open', function(){
                    self.conn.send('connected via webRTC!');
                });
            });
        })
    },
});
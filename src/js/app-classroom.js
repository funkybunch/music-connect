$(function () {
    let socket = io();
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

    let audioFiles = [
        "http://10.134.5.9:3000/uploads/mixkit-raising-me-higher-34.mp3"
    ];
    let filesLoaded = 0;
    let player = document.getElementById('player');

    function preloadAudio(url) {
        let audio = new Audio();
        // once this file loads, it will call loadedAudio()
        // the file will be kept by the browser as cache
        audio.addEventListener('canplaythrough', loadedAudio, false);
        audio.src = url;
    }

    function loadedAudio() {
        // this will be called every time an audio file is loaded
        // we keep track of the loaded files vs the requested files
        filesLoaded++;
        if (filesLoaded === audioFiles.length){
            // all have loaded
            $('#messages').append($('<li>').text('All Media Files Have Been Pre-Loaded'));
        }
    }

    function play(index) {
        player.src = audioFiles[index];
        player.play();
    }

    function pause() {
        player.pause();
    }

    function resume() {
        player.play();
    }

    function stop() {
        player.currentTime = player.duration;
        player.pause();
    }

    // we start preloading all the audio files
    for (let i in audioFiles) {
        preloadAudio(audioFiles[i]);
    }

    socket.emit('join', room);

    socket.on('user-id', function(uid){
        $('#messages').append($('<li>').text('Assigned User ID: ' + uid));
        userID = uid;
        peer.config = new Peer(userID, {
            host: window.location.hostname,
            port: 9000,
            path: '/'
        })
    });
    socket.on('connect-id', function(cid){
        $('#messages').append($('<li>').text('Connect ID' + cid));
        connection.config = peer.config.connect(cid);
    });
    socket.on('chat message', function(msg){
        $('#messages').append($('<li>').text(msg));
    });
    connection.registerListener(function(connection){
        $('#webrtc').append($('<li>').text('WebRTC Connection Initialized'));
        connection.on('data', (data) => {
            $('#webrtc').append($('<li>').text('Instructor Message: ' + data));
            if(data.startsWith("play ")) {
                play(parseInt(data.replace(/\D/g,''))-1);
            } else if(data === "pause") {
                pause();
            } else if(data === "resume") {
                resume();
            } else if(data === "stop") {
                stop();
            }
        });
    })
});
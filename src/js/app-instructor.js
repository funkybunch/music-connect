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

    socket.emit('join', room);

    $('form#messaging').submit(function(e) {
        e.preventDefault(); // prevents page reloading
        socket.emit('chat message', $('#m').val());
        $('#m').val('');
        return false;
    });

    socket.on('user-id', function(uid){
        $('#messages').append($('<li>').text('Assigned User ID: ' + uid));
        userID = uid;
        peer.config = new Peer(userID, {
            host: window.location.hostname,
            port: 9000,
            path: '/'
        })
    });

    peer.registerListener(function(webRTC){
        $('#webrtc').append($('<li>').text('WebRTC Connection Initialized'));
        webRTC.on('connection', function(conn) {
            $('#webrtc').append($('<li>').text('WebRTC Connection Established With Student'));
            conn.on('open', function(){
                conn.send('connected via webRTC!');
            });

            $('#play').click(function(e) {
                e.preventDefault(); // prevents page reloading
                $('#webrtc').append($('<li>').text('Sent: play 1'));
                conn.send('play 1');
                return false;
            });
            $('#pause').click(function(e) {
                e.preventDefault(); // prevents page reloading
                $('#webrtc').append($('<li>').text('Sent: pause'));
                conn.send('pause');
                return false;
            });
            $('#resume').click(function(e) {
                e.preventDefault(); // prevents page reloading
                $('#webrtc').append($('<li>').text('Sent: resume'));
                conn.send('resume');
                return false;
            });
            $('#stop').click(function(e) {
                e.preventDefault(); // prevents page reloading
                $('#webrtc').append($('<li>').text('Sent: stop'));
                conn.send('stop');
                return false;
            });
        });
    })

    socket.on('chat message', function(msg){
        $('#messages').append($('<li>').text(msg));
    });
});
const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const { PeerServer } = require('peer');
const UIDGenerator = require('uid-generator');
const uidgen = new UIDGenerator(256);

let classrooms = new Map();
const peerServer = PeerServer({ port: 9000, path: '/' });

function createClassroomID(iteration = 1) {
    let id = generateID();
    if(classrooms.has(id)) {
        iteration++;
        return createClassroomID(iteration);
    } else {
        return id;
    }
}

function generateID() {
    let result = '';
    let characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
    for ( let i = 0; i < 11; i++ ) {
        if(i === 3 || i === 7) {
            result += '-';
        } else {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
    }
    return result;
}

function createClassroom(teacher, className) {
    let roomID = createClassroomID();
    classrooms.set(roomID, {
        teacher: teacher,
        class: className,
        token: uidgen.generateSync(),
        attendees: 0
    });

    console.log('Classroom created.  ID:', roomID)
    return roomID;
}

function deleteClassroom(roomID) {
    classrooms.delete(roomID);
}

app.get('/', (req, res) => {
    res.send('<p>App Home Page</p>');
});

app.get('/js/socket.io.js', (req, res) => {
    res.sendFile(__dirname + '../../node_modules/socket.io-client/dist/socket.io.js');
});

app.get('/js/*', (req, res) => {
    res.sendFile(__dirname + '/src' + req.path);
});

app.get('/uploads/*', (req, res) => {
    res.sendFile(__dirname + '/src' + req.path);
});

app.get('/c/*/', (req, res) => {
    let classID = req.path.split('/')[2];
    if(classrooms.has(classID)) {
        let classData = classrooms.get(classID);
        res.status(200);
        res.sendFile(__dirname + '/src/classroom.html');
    } else {
        res.status(404);
        res.send("<p>Not Found</p>")
    }
});

app.get('/i/*/', (req, res) => {
    let classID = req.path.split('/')[2];
    if(classrooms.has(classID)) {
        let classData = classrooms.get(classID);
        res.status(200);
        res.sendFile(__dirname + '/src/instructor.html');
    } else {
        res.status(404);
        res.send("<p>Not Found</p>")
    }
});

app.get('/api/create/', (req, res) => {
    let teacher = req.query.teacher;
    let className = req.query.class;
    if(!teacher || !className) {
        res.status(400);
        res.json({
            status: 400,
            error: 'Both the `teacher` and `class` attributes are required.'
        });
    } else {
        res.status(200);
        res.json({
            status: 200,
            teacher: teacher,
            class: className,
            message: 'A new classroom has been created for ' + teacher + '\'s ' + className + ' class.',
            id: createClassroom(teacher, className)
        });
        console.log(classrooms);
    }
});

app.get('/api/delete/', (req, res) => {
    let classID = req.query.classID;
    if(!classID) {
        res.status(400);
        res.json({
            status: 400,
            error: 'The `classID` attribute is required.'
        });
    } else if(!classrooms.has(classID)) {
        res.status(400);
        res.json({
            status: 400,
            error: 'Cannot delete classroom.  The classroom ID (' + classID + ') does not exist.'
        });
    } else {
        let classData = classrooms.get(classID);
        deleteClassroom(classID);
        res.status(200);
        res.json({
            status: 200,
            teacher: classData.teacher,
            class: classData.class,
            message: 'The classroom for ' + classData.teacher + '\'s ' + classData.class + ' class with the ID ' + classID + ' has been deleted.'
        });
    }
});

app.get('/favicon.ico', (req, res) => {
    res.status(400);
});

app.get('*', (req, res) => {
    res.status(404);
    res.send("<p>Not Found</p>");
});

io.on('connection', (socket) => {
    let classID = socket.request.headers.referer.replace(/^https?:\/\//,'').split("/")[2];
    let connectionType = socket.request.headers.referer.replace(/^https?:\/\//,'').split("/")[1];

    if(classrooms.get(classID)) {
        let classData = classrooms.get(classID);
        socket.emit('chat message', 'Welcome to ' + classData.teacher + '\'s ' + classData.class + ' class.');
    }

    socket.on('join', function(room) {
        console.log('class ID', classID);
        socket.join(room);
        console.log('a user connected from:', socket.conn.remoteAddress);
        console.log(socket.conn.remoteAddress, 'connected to', room);
        if(classrooms.get(classID)) {
            let classData = classrooms.get(classID);
            classData.attendees++;
            classrooms.set(classID, classData);
            console.log('attendees in class: ' + classData.attendees)
            socket.emit('chat message', 'There are ' + classData.attendees + ' people in class right now.');
            if(connectionType === 'c') {
                socket.emit('user-id', socket.id);
                socket.emit('connect-id', classData.token);
            } else if(connectionType === 'i') {
                socket.emit('user-id', classData.token);
                io.to(classID).emit('connect-id', classData.token);
            }
        }
    });
    socket.on('chat message', (msg) => {
        io.to(classID).emit('chat message', msg);
    });
    socket.on('connection request', (msg) => {
        io.to(classID).emit('connection request', msg);
    });

    socket.on('disconnect', () => {
        if(classrooms.get(classID)) {
            let classData = classrooms.get(classID);
            classData.attendees--;
            classrooms.set(classID, classData);
        }
        console.log('user at ' + socket.conn.remoteAddress + ' disconnected');
    });
});

http.listen(3000, () => {
    console.log('listening on *:3000');
});
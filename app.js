const express = require('express');
const app = express();
const fs = require('fs');
const session = require('express-session');
const bodyParser = require('body-parser');
const multer = require('multer');
const upload = multer({ dest: 'tmp/' });
const http = require('http').createServer(app);
const url = require('url');
const io = require('socket.io')(http);
const path = require('path');
const {ExpressPeerServer} = require('peer');
const UIDGenerator = require('uid-generator');
const uidgen = new UIDGenerator(256);
require('dotenv').config()
const { v4: uuidv4 } = require('uuid');
const { google } = require('googleapis');
const OAuth2Data = (process.env.GOOGLE_CRED)? JSON.parse(process.env.GOOGLE_CRED) : require('./google-client-credentials.json');
const environment = process.env.NODE_ENV;

const common = require('./common.js');

const CLIENT_ID = OAuth2Data.web.client_id;
const CLIENT_SECRET = OAuth2Data.web.client_secret;
const REDIRECT_URL = (environment === "development")? OAuth2Data.web.redirect_uris[0] : OAuth2Data.web.redirect_uris[1];

const OAuth2Client = createConnection();
const scopes = [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile'
];

let instructors = (process.env.INSTRUCTORS)? JSON.parse(process.env.INSTRUCTORS) : require('./data/instructors.json');

app.set('trust proxy', 1)
app.use(session({
    secret: process.env.APPSECRET,
    resave: true,
    saveUninitialized: true,
    genid: function(req) {
        return uuidv4(); // use UUIDs for session IDs
    },
    cookie: {
        maxAge: 24 * 60 * 60 * 365 * 1000
    }
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

app.use(function (err, req, res, next) {
    console.log('This is the invalid field ->', err.field)
    next(err)
});

const peerServer = ExpressPeerServer(http, {
    debug: true,
    path: '/'
});

app.use('/switchboard', peerServer);

let [socketioUpgradeListener, peerUpgradeListener] = http.listeners('upgrade').slice(0);
http.removeAllListeners('upgrade');
http.on('upgrade', (req, socket, head) => {
    const pathname = url.parse(req.url).pathname;
    if (pathname.startsWith('/socket.io')) {
        socketioUpgradeListener(req, socket, head);
    } else if (pathname.startsWith('/switchboard')) {
        peerUpgradeListener(req, socket, head);
    } else {
        socket.destroy();
    }
});

let classrooms = new Map();

function createConnection() {
    return new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL);
}

function generateToken() {
    require('crypto').randomBytes(48, function(err, buffer) {
        return buffer.toString('hex');
    });
}

function authenticate(req) {
    if (!req.session.authed) {
        // Generate an OAuth URL and redirect there
        const url = OAuth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: scopes,
        });
        return {
            redirect: true,
            url: url,
            message: 'Redirecting'
        };
    } else {
        return {
            redirect: false,
            message: 'Logged in'
        };
    }
}

function saveClassroomRedirect(request, classroomID, instructor = false) {
    request.session.redirect = {classroom: classroomID, instructor: instructor}
}

function saveProfileToSession(request, profile) {
    request.session.profile = profile;
    request.session.save()
}

function createClassroomID(iteration = 1) {
    let id = generateID();
    if(classrooms.has(id)) {
        iteration++;
        return createClassroomID(iteration);
    } else {
        return id;
    }
}

function isSignedIn(session) {
    if(session.authed && session.authed === true) {
        return true;
    }
    return false;
}

function isInstructor(profile) {
    if(profile) {
        for(let i = 0;i < profile.emails.length; i++) {
            if(instructors.includes(profile.emails[i].value)) {
                return true;
            }
        }
    }
    return false;
}

function isOwner(profile, classroomID) {
    if(profile && isInstructor(profile)) {
        let instructorEmail = classrooms.get(classroomID).email;
        for(let i = 0;i < profile.emails.length; i++) {
            if(instructorEmail === profile.emails[i].value) {
                return true;
            }
        }
    }
    return false;
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

function createClassroom(profile, teacher, className) {
    let roomID = createClassroomID();
    classrooms.set(roomID, {
        teacher: teacher,
        email: profile.emails[0].value,
        class: className,
        token: uidgen.generateSync(),
        open: false,
        media: [],
        attendees: 0
    });

    return roomID;
}

function deleteClassroom(roomID) {
    classrooms.delete(roomID);
}

// Make sure the client is loaded and sign-in is complete before calling this method.
function getUserData(client, request) {
    const service = google.people({version: 'v1', auth: client});
    service.people.get({
        resourceName: "people/me",
        personFields: "names,emailAddresses"
    }, (err, res) => {
        if (err) return console.error('The API returned an error: ' + err);
        const profile = res.data;
        if (profile) {
            for(let i = 0; i < profile.emailAddresses.length; i++) {
                delete profile.emailAddresses[i].metadata;
            }
            let userProfile = {
                name: profile.names[0].displayName,
                emails: profile.emailAddresses
            };
            userProfile.isInstructor = isInstructor(userProfile);
            saveProfileToSession(request, userProfile);
        }
    });
}

app.get('/', (req, res) => {
    if(req.session.redirect) {
        if(req.session.redirect.instructor) {
            res.redirect('/i/' + req.session.redirect.classroom);
        } else {
            res.redirect('/c/' + req.session.redirect.classroom);
        }
    } else {
        res.status(200);
        res.sendFile(__dirname + '/src/home.html');
    }
});

app.get('/classes/', (req, res) => {
    if(req.session.redirect) {
        if(req.session.redirect.instructor) {
            res.redirect('/i/' + req.session.redirect.classroom)
        } else {
            res.redirect('/c/' + req.session.redirect.classroom)
        }
    } else {
        if(isInstructor(req.session.profile)) {
            res.status(200);
            res.sendFile(__dirname + '/src/instructor-home.html');
        } else {
            res.redirect('/');
        }
    }
});

app.get('/js/socket.io.js', (req, res) => {
    res.sendFile(path.join(__dirname, './node_modules/socket.io-client/dist/socket.io.js'));
});

app.get('/socket.io/', (req, res) => {
    res.sendFile(path.join(__dirname, './node_modules/socket.io-client/dist/socket.io.js'));
});

app.get('/js/*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', req.path));
});

app.get('/assets/*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', req.path));
});

app.get('/media/*', (req, res) => {
    res.sendFile(__dirname + '/uploads' + req.path);
});

// Remove this once files can be uploaded
app.get('/uploads/*', (req, res) => {
    res.sendFile(__dirname + req.path);
});

app.get('/auth', function (req, res) {
    const code = req.query.code
    let request = req;
    if (code) {
        // Get an access token based on our OAuth code
        OAuth2Client.getToken(code, function (err, tokens) {
            if (err) {
                console.err(err);
            } else {
                OAuth2Client.setCredentials(tokens);
                request.session.tokens = tokens;
                getUserData(OAuth2Client, request);
                req.session.authed = true;
                req.session.save();
                res.redirect('/');
            }
        });
    }
});

app.get('/signout', function (req, res) {
    if(req.session.authed && req.session.authed === true) {
        req.session.authed = false;
        req.session.profile = {};
        req.session.save();
    }
    res.redirect('/');
});

app.get('/c/*/', (req, res) => {
    if(req.session.redirect) {
        delete req.session.redirect;
    }
    let classID = req.path.split('/')[2];
    if(classrooms.has(classID)) {
        let auth = authenticate(req);
        if(auth.redirect) {
            saveClassroomRedirect(req, classID, false);
            res.redirect(auth.url);
        } else {
            let classData = classrooms.get(classID);
            res.status(200);
            res.sendFile(__dirname + '/src/classroom.html');
        }
    } else {
        res.status(404);
        res.send("<p>Not Found</p>")
    }
});

app.get('/i/*/', (req, res) => {
    if(req.session.redirect) {
        delete req.session.redirect;
    }
    let classID = req.path.split('/')[2];
    if(classrooms.has(classID)) {
        let auth = authenticate(req);
        if(auth.redirect) {
            saveClassroomRedirect(req, classID, true);
            res.redirect(auth.url);
        } else {
            if(isOwner(req.session.profile, classID)) {
                let classData = classrooms.get(classID);
                res.status(200);
                res.sendFile(__dirname + '/src/instructor.html');
            } else {
                res.status(403);
                res.send("<h1>Not Authorized</h1><p>You are not an instructor of this class.  Please make sure you are signed into the correct account.</p>")
            }
        }
    } else {
        res.status(404);
        res.send("<p>Not Found</p>")
    }
});

app.get('/signin/', (req, res) => {
    if(req.session.redirect) {
        delete req.session.redirect;
    }
    let auth = authenticate(req);
    if(auth.redirect) {
        res.redirect(auth.url);
    } else {
        res.redirect('/');
    }
});

app.get('/api/create/', (req, res) => {
    if(isInstructor(req.session.profile)) {
        let teacher = req.session.profile.name;
        let className = req.query.class;
        if(!teacher || !className) {
            res.status(400);
            res.json({
                status: 400,
                error: 'The `class` attribute is required.'
            });
        } else {
            res.status(200);
            res.json({
                status: 200,
                teacher: teacher,
                class: className,
                message: 'A new classroom has been created for ' + teacher + '\'s ' + className + ' class.',
                id: createClassroom(req.session.profile, teacher, className)
            });
        }
    } else {
        res.status(403);
        res.send("Not Authorized");
    }
});

app.get('/api/delete/', (req, res) => {
    let classID = req.query.classID;
    if(isOwner(req.session.profile, classID)) {
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
    } else {
        res.status(403);
        res.send("Not Authorized");
    }
});

app.get('/api/classes/', (req, res) => {
    if(isInstructor(req.session.profile)) {
        let myClasses = [];
        for (const [classID, value] of classrooms.entries()) {
            for(let i = 0; i < req.session.profile.emails.length; i++) {
                if(req.session.profile.emails[i].value === value.email) {
                    let classFound = classrooms.get(classID);
                    classFound.classID = classID;
                    myClasses.push(classFound);
                }
            }
        }
        res.status(200);
        res.json(myClasses);
    } else {
        res.status(403);
        res.send("Not Authorized");
    }
});

app.get('/api/class/', (req, res) => {
    let classID = req.query.classID;
    if(classrooms.has(classID)) {
        if(isOwner(req.session.profile, classID)) {
            let classroom = classrooms.get(classID);
            classroom.id = classID;
            res.status(200);
            res.json(classroom);
        } else if(isSignedIn(req.session)) {
            let classroom = classrooms.get(classID);
            res.status(200);
            let response = {
                teacher: classroom.teacher,
                class: classroom.class,
                media: classroom.media,
                open: classroom.open
            }
            res.json(response);
        } else {
            res.status(403);
            res.send("Not Authorized");
        }
    } else {
        res.status(404);
        res.send("Not Found");
    }
});

app.get('/api/open/', (req, res) => {
    let classID = req.query.classID;
    if(isOwner(req.session.profile, classID)) {
        let classData = classrooms.get(classID);
        classData.open = true;
        classrooms.set(classID, classData);
        res.status(200);
        res.json({
            status: 200,
            message: "The classroom is now open."
        });
    } else {
        res.status(403);
        res.send("Not Authorized");
    }
});

app.get('/api/close/', (req, res) => {
    let classID = req.query.classID;
    if(isOwner(req.session.profile, classID)) {
        let classData = classrooms.get(classID);
        classData.open = false;
        classrooms.set(classID, classData);
        res.status(200);
        res.json({
            status: 200,
            message: "The classroom has been closed."
        });
    } else {
        res.status(403);
        res.send("Not Authorized");
    }
});

app.post('/api/upload/', upload.single('media'), (req, res, next) => {
    let classID = req.body.classID;
    let duration = req.body.duration;
    console.log("duration posted", duration)
    if(isOwner(req.session.profile, classID)) {
        if (!req.file) {
            res.status(400);
            res.send('No files were submitted.');
        }
        let mediaFile = req.file;

        let filename = common.generateUniqueFilename(path.join(__dirname, 'uploads', classID), "." + common.getFileExtension(mediaFile.originalname));

        fs.mkdir(path.join(__dirname, 'uploads', classID), { recursive: true }, (err) => {
            if (err) throw err;
        });

        fs.rename(path.join(__dirname, mediaFile.path), path.join(__dirname, 'uploads', classID, filename), function(err) {
            if (err) throw err
            console.log('Successfully moved!')
        })

        let classData = classrooms.get(classID);
        let tmp = {
                name: mediaFile.originalname,
                duration: duration,
                file: "/uploads/" + classID + "/" + filename
            };
        classData.media.push(tmp);
        classrooms.set(classID, classData);

        res.status(200);
        res.json({ status: 200, message: "The file has been added to the lesson plan." });
    }
});

app.get('/api/profile/', (req, res) => {
    if(req.session.profile) {
        let profile = req.session.profile;
        res.status(200);
        res.json(profile);
    } else {
        res.status(403);
        res.json({});
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
            let clients = io.nsps['/'].adapter.rooms[room];
            let attendees = Object.keys(clients).length;
            classData.attendees = attendees-1;
            classrooms.set(classID, classData);
            console.log('attendees in class: ' + classData.attendees)
            socket.emit('chat message', 'There are ' + classData.attendees + ' people in class right now.');
            if(connectionType === 'c') {
                socket.emit('user-id', socket.id);
                io.to(classID).emit('connect-id', classData.token);
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
        let classData = classrooms.get(classID);
        if(classrooms.get(classID)) {
            if(connectionType === 'c') {
                socket.emit('user-id', socket.id);
                io.to(classID).emit('connect-id', classData.token);
            } else if(connectionType === 'i') {
                socket.emit('user-id', classData.token);
                io.to(classID).emit('connect-id', classData.token);
            }
        }
    });

    socket.on('disconnect', () => {
        console.log('a user disconnected');
    });
});

http.listen(3000, () => {
    console.log('listening on *:3000');
});
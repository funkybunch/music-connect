const common = require('./common.js');

const fs = require('fs');
const path = require('path');
const axios = require('axios').default;
const env = require('dotenv').config();
const { spawn } = require('child_process');

// NPM Install
function installApp() {
    spawnProcess('npm', ['install'], function() {
        spawnProcess('npm', ['run', 'build']);
    });
}

function spawnProcess(cmd, args, callback = function() {
    console.log("End of processes");
}) {
    const process = spawn(cmd, args, {stdio: ['inherit']});
    process.stdout.on('data', function(data) {
        console.log(data.toString());
    });
    process.stderr.on('data', function(data) {
        console.log('stderr: ' + data.toString());
    });
    process.on('exit', function(code) {
        console.log('child process exited with code ' + code.toString());
    });
    process.on('close', function() {
        console.log('Calling callback');
        callback();
    });
}

installApp();
const common = require('./common.js');

const fs = require('fs');
const path = require('path');
const axios = require('axios').default;
const env = require('dotenv').config();
const { spawn } = require('child_process');

// Functions
function buildApp() {
    spawnProcess('npm', ['run', 'build']);
}

function spawnProcess(cmd, args) {
    const process = spawn(cmd, args, {stdio: ['inherit']});
    process.stdout.on('data', function(data) {
        console.log(data.toString());
    });
    process.stderr.on('data', function(data) {
        console.log('stderr: ' + data.toString());
    });
    process.on('exit', function(code) {
        console.log('child process exited with code ' + code.toString());
    })
}

buildApp()
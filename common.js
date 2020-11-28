const path = require('path');
const fs = require('fs');

exports.fileExists = function(path) {
    try {
        if (fs.existsSync(path)) {
            return true;
        }
    } catch(err) {
        return false;
    }
}

exports.generateToken = function(length) {
    let result           = '';
    let validChars       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for ( var i = 0; i < length; i++ ) {
        result += validChars.charAt(Math.floor(Math.random() * validChars.length));
    }
    return result;
}

exports.generateUniqueFilename = function(parentPath, extension) {
    let name = this.generateToken(48);
    if(this.fileExists(path.join(parentPath, name, extension))) {
        return this.generateUniqueFilename(parentPath, extension);
    }
    return name + extension;
}

exports.getFileExtension = function(filename) {
    return filename.split('.').pop();
}
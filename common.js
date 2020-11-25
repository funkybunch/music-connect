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

exports.generateUniqueFilename = function(parentPath, extension) {
    let name = generateToken(48);
    if(this.fileExists(path.join(parentPath, name, extension))) {
        return this.generateUniqueFilename(parentPath, extension);
    }
    return name + extension;
}

exports.getFileExtension = function(filename) {
    return filename.split('.').pop();
}
const fs = require('fs');
const path = require('path');
const Document = require('../models/Document')

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 *1000;

async function cleanupOldFiles() {
    const uploadsDir = path.join(__dirname,'../uploads');
    const files = fs.readdirSync(uploadsDir);

    for(const file of files){
        const filePath = path.join(uploadsDir,file);
        const stats = fs.statSync(filePath);
        const age = Date.now() - stats.birthtimeMs;

        if(age > THIRTY_DAYS_MS){
            fs.unlinkSync(filePath);
            console.log(`Deleted old file: ${file}`);

            await Document.updateMany({savedFile:file},{savedFile:null});
        }
    }
}

module.exports = cleanupOldFiles;

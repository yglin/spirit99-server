var express = require('express');
var HttpStatus = require('http-status-codes');
var fs = require('fs');
var mime = require('mime-types')
var multer  = require('multer');
var upload = multer({dest: '/tmp/'});

var router = express.Router();

router.post('/', upload.single('file'), function (req, res) {
    if(req.file){
        if(req.file.size <= 0){
            res.status(HttpStatus.BAD_REQUEST);
            res.send('File size = 0, uploading failed');
        }
        else{
            var source = fs.createReadStream(req.file.path);
            var destFilepath = '/uploads/nuclear-waste/' + req.file.filename + '.'
            + (mime.extension(req.file.mimetype) ? mime.extension(req.file.mimetype) : '');
            var dest = fs.createWriteStream(req.app.get('static_path') + destFilepath);
            dest.on('finish', function () {
                fs.unlink(req.file.path);
                res.json({
                    link: req.protocol + '://' + req.get('host') + destFilepath
                });
            });
            source.pipe(dest);
        }
    }
});

module.exports = router;
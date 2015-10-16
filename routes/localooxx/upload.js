var express = require('express');
var HttpStatus = require('http-status-codes');
var fs = require('fs');
var mime = require('mime-types');
var multer  = require('multer');
var mkdirp = require('mkdirp');

var upload = multer({dest: '/tmp/'});

var router = express.Router();

router.post('/', upload.single('imageFile'), function (req, res) {
    if(req.file){
        if(req.file.size <= 0){
            res.status(HttpStatus.BAD_REQUEST);
            res.send('File size = 0, uploading failed');
        }
        else{
            var source = fs.createReadStream(req.file.path);
            var destFilepath = '/uploads/localooxx/' + req.file.filename + '.'
            + (mime.extension(req.file.mimetype) ? mime.extension(req.file.mimetype) : '');
            mkdirp(req.app.get('static_path') + '/uploads/localooxx/');
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
var express = require('express');
var HttpStatus = require('http-status-codes');
var fs = require('fs');
var mime = require('mime-types')
var multer  = require('multer');
var mkdirp = require('mkdirp');
var moment = require('moment');
var crypto = require('crypto');

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
            var destFilepath = '/uploads/' + req.file.filename + '.'
            + (mime.extension(req.file.mimetype) ? mime.extension(req.file.mimetype) : '');
            mkdirp(req.app.get('static_path') + '/uploads/');
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

router.get('/aws-s3-config', function (req, res) {
    var s3Config = {
        bucket: 'spirit99',
        region: 's3',
        keyStart: 'uploads/',
        acl: 'public-read',
        accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID
    };

    s3Config.policy = {
        expiration: moment().add(1, 'days').toISOString(),
        conditions: [
            { bucket: s3Config.bucket },
            { acl: s3Config.acl },
            { success_action_status: '201' },
            { 'x-requested-with': 'xhr' },
            [ 'starts-with', '$key', s3Config.keyStart ],
            [ 'starts-with', '$Content-Type', '' ]
        ]
    };
    s3Config.policy = new Buffer(JSON.stringify(s3Config.policy)).toString('base64');

    var hash = crypto.createHmac('sha1', process.env.AWS_S3_SECRET_ACCESS_KEY);
    s3Config.signature = new Buffer(hash.update(s3Config.policy).digest()).toString('base64');

    res.json(s3Config);
});

module.exports = router;
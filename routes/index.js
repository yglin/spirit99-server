var express = require('express');
var HttpStatus = require('http-status-codes');

var post = require('./post');
var comment = require('./comment');

var router = express.Router();

router.get('/portal', function (req, res) {
    if(req.station && req.station in req.app.stations && 'portal' in req.app.stations[req.station]){
        var portalData = JSON.parse(JSON.stringify(req.app.stations[req.station].portal));
        if(process.env.NODE_ENV == 'development' && 'title' in portalData){
            portalData.title += '(DEV)';
        }
        if('urls' in portalData){
            for(var key in portalData.urls){
                portalData.urls[key] = req.protocol + '://' + req.get('host') + '/' + req.station + '/' + portalData.urls[key];
            }
        }
        res.json(portalData);
    }
    else{
        res.status(HttpStatus.NOT_FOUND);
        res.send('Can not find portal data of station: ' + req.station);
    }
});

router.use('/posts', post);
router.use('/posts/:post_id/comments',
function (req, res, next) {
    // console.log(req.params);
    req.post_id = req.params.post_id;
    next();
}, comment);

module.exports = router;

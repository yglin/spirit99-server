var express = require('express');
var router = express.Router();

router.get('/localstory', function(req, res){
    var portalData = {
        name: 'localstory',
        title: '在地的故事',
        postUrl: 'http://localhost:3000/posts',
        logo: 'http://www.tuxpaint.org/stamps/stamps/town/houses/cartoon/city.svg',
        markerIconSet: [
            'http://emojipedia.org/wp-content/uploads/2014/04/1f35a-google-android.png',
            'https://cdn2.iconfinder.com/data/icons/fatcow/32x32/shirt_polo.png'
        ]
    };
    res.json(portalData);
});

router.get('/birdhome', function(req, res){
    var portalData = {
        name: 'birdhome',
        title: '小小鳥兒要回家',
        // logo: 'http://a1599.phobos.apple.com/us/r30/Purple/v4/3f/27/1e/3f271e59-0b19-c8e9-5288-48aeb55f5c25/mzl.xqyzscwo.128x128-75.png',
        postUrl: 'http://localhost:3000/birds'
    };
    res.json(portalData);
});

module.exports = router;
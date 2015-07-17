var express = require('express');
var router = express.Router();

router.get('/localstory', function(req, res){
    var profile = {
        name: 'localstory',
        title: '在地的故事',
        logo: 'http://www.tuxpaint.org/stamps/stamps/town/houses/cartoon/city.svg'
    };
    res.json(profile);
});

router.get('/birdhome', function(req, res){
    var profile = {
        name: 'birdhome',
        title: '小小鳥兒要回家',
        logo: 'http://a1599.phobos.apple.com/us/r30/Purple/v4/3f/27/1e/3f271e59-0b19-c8e9-5288-48aeb55f5c25/mzl.xqyzscwo.128x128-75.png'
    };
    res.json(profile);
});

module.exports = router;
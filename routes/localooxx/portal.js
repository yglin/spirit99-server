var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
    // console.log(req.path.replace(req.baseUrl, '/posts'));
    var portalData = {
        name: 'localooxx',
        title: process.env.NODE_ENV == 'production' ? '地方的ＯＯ需要ＸＸ' : '地方的ＯＯ需要DEV',
        intro: '<h3>這是一個在地物資共享的網站</h3>',
        portalUrl: req.protocol + '://' + req.get('host') + '/localooxx/portal',
        postUrl: req.protocol + '://' + req.get('host') + '/localooxx/posts',
        commentUrl: req.protocol + '://' + req.get('host') + '/localooxx/posts/:post_id/comments',
        uploadUrl: req.protocol + '://' + req.get('host') + '/localooxx/upload',
        uploadParamName: 'imageFile',
        logo: 'https://www.evansville.edu/residencelife/images/greenLogo.png',
        iconSet: {
            '食': 'http://4vector.com/i/free-vector-bowl-of-rice-clip-art_105584_Bowl_Of_Rice_clip_art_hight.png',
            '衣': 'http://m.tenki.tw/img/index_icon/cloth_icon.png',
            '住': 'http://icons.iconarchive.com/icons/iconshock/smurf/256/smurf-house-icon.png',
            '行': 'https://cdn1.iconfinder.com/data/icons/professional-toolbar-icons-png/64/Run.png',
            '育': 'http://netkosh.com/images/classified/education_icon.png',
            '樂': 'http://prazdnikdetyam.by/sites/default/files/freephile_balloons.png',
        },
        followPostBy: ['modify_time']
    };
    res.json(portalData);
});

module.exports = router;

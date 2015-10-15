var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
    // console.log(req.path.replace(req.baseUrl, '/posts'));
    var portalData = {
        name: 'nuclear-waste',
        title: process.env.NODE_ENV == 'production' ? '核廢料掩埋場' : '核廢料掩埋場(DEV)',
        intro: '<h3>就是個丟棄核廢料的地方，百無禁忌</h3><br><h5>注意：這是測試用的電台，所以文章不定時會清除，最多保留三個月</h5>',
        portalUrl: req.protocol + '://' + req.get('host') + '/nuclear-waste/portal',
        postUrl: req.protocol + '://' + req.get('host') + '/nuclear-waste/posts',
        commentUrl: req.protocol + '://' + req.get('host') + '/nuclear-waste/posts/:post_id/comments',
        uploadUrl: req.protocol + '://' + req.get('host') + '/nuclear-waste/upload',
        uploadParamName: 'imageFile',
        logo: 'https://yt3.ggpht.com/-Gd9lF_AqQPk/AAAAAAAAAAI/AAAAAAAAAAA/afbtVZjs18E/s88-c-k-no/photo.jpg',
        iconSet: {
            sweat: 'http://findicons.com/files/icons/2020/2s_space_emotions/128/sweat.png',
            cry: 'http://findicons.com/files/icons/2020/2s_space_emotions/128/cry.png',
            love: 'http://findicons.com/files/icons/2020/2s_space_emotions/128/love.png',
            startle: 'http://findicons.com/files/icons/2020/2s_space_emotions/128/startle.png',
            fire: 'http://findicons.com/files/icons/2020/2s_space_emotions/128/fire.png',
            surprise: 'http://findicons.com/files/icons/2020/2s_space_emotions/128/surprise.png',
            miao: 'http://findicons.com/files/icons/2020/2s_space_emotions/128/miao.png',
            burn: 'http://findicons.com/files/icons/2020/2s_space_emotions/128/burn.png',
            question: 'http://findicons.com/files/icons/2020/2s_space_emotions/128/question.png',
            confused: 'http://findicons.com/files/icons/2020/2s_space_emotions/128/confused.png',
            thirst: 'http://findicons.com/files/icons/2020/2s_space_emotions/128/thirst.png',
            shout: 'http://findicons.com/files/icons/2020/2s_space_emotions/128/shout.png',
            prettiness: 'http://findicons.com/files/icons/2020/2s_space_emotions/128/prettiness.png',
            vomit: 'http://findicons.com/files/icons/2020/2s_space_emotions/128/vomit.png',
            grimace: 'http://findicons.com/files/icons/2020/2s_space_emotions/128/grimace.png',
            spook: 'http://findicons.com/files/icons/2020/2s_space_emotions/128/spook.png',
            anger: 'http://findicons.com/files/icons/2020/2s_space_emotions/128/anger.png',
            smile: 'http://findicons.com/files/icons/2020/2s_space_emotions/128/smile.png',
            slobber: 'http://findicons.com/files/icons/2020/2s_space_emotions/128/slobber.png',
            cool: 'http://findicons.com/files/icons/2020/2s_space_emotions/128/cool.png'
        },
        followPostBy: ['modify_time'],
        statisticUrl: req.protocol + '://' + req.get('host') + '/nuclear-waste/posts/:post_id/statistics',
    };
    res.json(portalData);
});

module.exports = router;

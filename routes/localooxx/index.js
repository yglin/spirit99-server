var express = require('express');
var router = express.Router();
var mysql = require('mysql');

router.use(function (req, res, next) {
    // Set up connection to mysql DB
    var dbOptions = req.app.get('dbOptions');
    dbOptions.database = 'localooxx';
    req.db = mysql.createConnection(dbOptions);
    next();
    // req.db.end(function (error) {
    //     if(error){
    //         console.log(error);
    //     }
    // });
});

router.use('/portal', require('./portal'));
router.use('/posts', require('./post'));
router.use('/upload', require('./upload'));

module.exports = router;

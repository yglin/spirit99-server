var express = require('express');
var router = express.Router();

router.get('/', function(req, res){
    var db = req.db;
    db.connect();
    db.query('SELECT * FROM `user`', function(error, results, fields){
        if(error){
            res.json(error);
        }
        else{
            res.json(results);
        }
    });
    db.end();
});

module.exports = router;

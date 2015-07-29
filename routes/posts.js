var express = require('express');
var router = express.Router();

router.get('/', function(req, res){
    var db = req.db;
    db.query('SELECT `id`,`title`,`latitude`,`longitude`,`icon` FROM `story`', function(error, results, fields){
        if(error){
            res.json(error);
        }
        else{
            res.json(results);
        }
    });
});

router.get('/:post_id', function(req, res){
    // console.log(req);
    var db = req.db;
    db.query('SELECT * FROM `story` WHERE `id`=? LIMIT 1', [req.params.post_id], function(error, results, fields){
        if(error){
            res.json(error);
        }
        else{
            console.log(results);
            res.json(results[0]);
        }
    });
});

router.post('/', function(req, res){
    var db = req.db;
    // console.log(req.body);
    db.query('INSERT INTO `story` SET ?', req.body, function(error, result){
        if(error){
            console.log(error);
            res.json(error);
        }
        else{
            res.json(result);
        }        
    });
});

module.exports = router;

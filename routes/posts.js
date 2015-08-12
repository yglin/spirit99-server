var express = require('express');
var HttpStatus = require('http-status-codes');
var mysql = require('mysql');
var router = express.Router();

router.get('/', function(req, res){
    var sql = 'SELECT * FROM `story`';
    if(Array.isArray(req.query.fields)){
        sql = mysql.format('SELECT ?? FROM `story`', [req.query.fields]);
    }
    console.log(sql);
    req.db.query(sql, function (error, results, fields){
        if(error){
            res.status(HttpStatus.INTERNAL_SERVER_ERROR);
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
    db.query('SELECT * FROM `story` WHERE `id`=? LIMIT 1', [req.params.post_id], function (error, results, fields){
        if(error){
            res.status(HttpStatus.INTERNAL_SERVER_ERROR);
            res.json(error);
        }
        else{
            var fullReqUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
            res.links({
                comments: fullReqUrl + '/comments',
            });
            res.json(results[0]);
        }
    });
});

router.post('/', function(req, res){
    var db = req.db;
    // console.log(req.body);
    db.query('INSERT INTO `story` SET ?', req.body, function (error, result){
        if(error){
            res.status(HttpStatus.INTERNAL_SERVER_ERROR);
            res.json(error);
        }
        else{
            db.query('SELECT * FROM `story` WHERE `id`=?', [result.insertId],
                function (error, results) {
                    if(error){
                        res.status(HttpStatus.INTERNAL_SERVER_ERROR);
                        res.json(error);                        
                    }
                    else{
                        res.status(HttpStatus.CREATED);
                        res.json(results[0]);                        
                    }
            });
        }        
    });
});

router.get('/:post_id/comments', function (req, res) {
    req.db.query('SELECT * FROM `comments` WHERE `post_id`=?', [req.params.post_id], function (error, results, fields) {
        if(error){
            res.status(HttpStatus.INTERNAL_SERVER_ERROR);
            res.json(error);
        }
        else{
            res.json(results);
        }
    });
});

router.post('/:post_id/comments', function (req, res) {
    req.body.post_id = req.params.post_id;
    req.db.query('INSERT INTO `comments` SET ?', req.body,
        function(error, result){
            if(error){
                res.status(HttpStatus.INTERNAL_SERVER_ERROR);
                res.json(error);
            }
            else{
                req.db.query('SELECT * FROM `comments` WHERE `id`=?', result.insertId,
                    function (error, results) {
                        if(error){
                            res.status(HttpStatus.INTERNAL_SERVER_ERROR);
                            res.json(error);                        
                        }
                        else{
                            res.status(HttpStatus.CREATED);
                            res.json(results[0]);
                        }
                });
            }        
    });
});

module.exports = router;

var express = require('express');
var HttpStatus = require('http-status-codes');
var mysql = require('mysql');

var router = express.Router();

router.get('/', function (req, res) {
    req.app.mysqlPoolCluster.getConnection(req.station, function (error, connection) {
        if(error){
            console.log(error);
            res.status(HttpStatus.INTERNAL_SERVER_ERROR);
            res.send(error);
        }
        else{
            connection.query('SELECT * FROM `comment` WHERE `post_id`=?', [req.post_id],
            function (error, results) {
                if(error){
                    console.log(error);
                    res.status(HttpStatus.INTERNAL_SERVER_ERROR);
                    res.json(error);
                }
                else{
                    res.json(results);
                }
                connection.release();
            });
        }
    });
});

router.post('/', function (req, res) {
    req.app.mysqlPoolCluster.getConnection(req.station, function (error, connection) {
        if(error){
            console.log(error);
            res.status(HttpStatus.INTERNAL_SERVER_ERROR);
            res.send(error);
        }
        else{
            req.body.post_id = req.post_id;
            connection.query('INSERT INTO `comment` SET ?', req.body,
            function(error, result){
                if(error){
                    console.log(error);
                    res.status(HttpStatus.INTERNAL_SERVER_ERROR);
                    res.send(error);
                }
                else{
                    connection.query('UPDATE `post` SET `modify_time` = NOW() WHERE `id` = ?', [req.post_id],
                    function (error, result) {
                        if(error){
                            console.log(error);
                        }
                    });

                    connection.query('SELECT * FROM `comment` WHERE `id`=?', result.insertId,
                    function (error, results) {
                        if(error){
                            console.log(error);
                            res.status(HttpStatus.INTERNAL_SERVER_ERROR);
                            res.send(error);                        
                        }
                        else{
                            res.status(HttpStatus.CREATED);
                            res.json(results[0]);
                        }
                        connection.release();
                    });
                }        
            });
        }
    });
});


module.exports = router;
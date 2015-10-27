var express = require('express');
var HttpStatus = require('http-status-codes');
var mysql = require('mysql');

var router = express.Router();

var crypto = require('crypto'),
    algorithm = 'aes-256-ctr',
    serverKeycode = 'ru.3g6ru.3gp6';

function encrypt(text, password){
  var cipher = crypto.createCipher(algorithm,password)
  var crypted = cipher.update(text,'utf8','hex')
  crypted += cipher.final('hex');
  return crypted;
}
 
function decrypt(text, password){
  var decipher = crypto.createDecipher(algorithm,password)
  var dec = decipher.update(text,'hex','utf8')
  dec += decipher.final('utf8');
  return dec;
}

router.get('/', function (req, res) {
    req.app.mysqlPoolCluster.getConnection(req.station, function (error, connection) {
        if(error){
            console.log(error);
            res.status(HttpStatus.INTERNAL_SERVER_ERROR);
            res.send(error);
        }
        else{
            connection.query('SELECT * FROM `vote` WHERE `post_id`=?' , req.post_id,
            function (error, results) {
                if(error){
                    console.log(error);
                    res.status(HttpStatus.INTERNAL_SERVER_ERROR);
                    res.send(error);
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
    req.body.post_id = req.post_id;
    req.app.mysqlPoolCluster.getConnection(req.station, function (error, connection) {
        if(error){
            console.log(error);
            res.status(HttpStatus.INTERNAL_SERVER_ERROR);
            res.send(error);
        }
        else{    
            connection.query('INSERT INTO `vote` SET ?', req.body,
            function(error, result){
                if(error){
                    console.log(error);
                    res.status(HttpStatus.INTERNAL_SERVER_ERROR);
                    res.send(error);
                    connection.release();      
                }
                else{
                    connection.query('SELECT * FROM `vote` WHERE `id`=?', result.insertId,
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

router.put('/:id', function (req, res) {
    req.app.mysqlPoolCluster.getConnection(req.station, function (error, connection) {
        if(error){
            console.log(error);
            res.status(HttpStatus.INTERNAL_SERVER_ERROR);
            res.send(error);
        }
        else{    
            connection.query('UPDATE `vote` SET `count` = `count` + 1 WHERE `id` = ?', [req.params.id],
            function (error, results) {
                if(error){
                    console.log(error);
                    res.status(HttpStatus.INTERNAL_SERVER_ERROR);
                    res.send(error);
                    connection.release();           
                }
                else{
                    connection.query('SELECT * FROM `vote` WHERE `id` = ?', [req.params.id],
                    function (error, results) {
                        if(error){
                            console.log(error);
                            res.status(HttpStatus.INTERNAL_SERVER_ERROR);
                            res.send(error);                        
                        }
                        else{
                            res.json(results[0]);
                        }
                        connection.release();
                    });
                }
            });
        }
    });
});

router.delete('/:id', function (req, res) {
    req.app.mysqlPoolCluster.getConnection(req.station, function (error, connection) {
        if(error){
            console.log(error);
            res.status(HttpStatus.INTERNAL_SERVER_ERROR);
            res.send(error);
        }
        else{    
            connection.query('SELECT * FROM `post` WHERE `id`=? LIMIT 1', [req.post_id],
            function (error, results){
                if(error){
                    console.log(error);
                    res.status(HttpStatus.INTERNAL_SERVER_ERROR);
                    res.send(error);
                    connection.release();
                }
                else if(results.length <= 0){
                    res.status(HttpStatus.NOT_FOUND);
                    res.send('Can not find post with id = ' + req.post_id);
                    connection.release();
                }
                else{
                    var post = results[0];
                    var password = req.get('password');
                    if(password && decrypt(password, serverKeycode) == post.password){
                        connection.query('DELETE FROM `vote` WHERE `id`=? LIMIT 1', [req.params.id],
                        function (error, results) {
                            if(error){
                                console.log(error);
                                res.status(HttpStatus.INTERNAL_SERVER_ERROR);
                                res.send(error);
                            }
                            else{
                                res.send(results);
                            }
                            connection.release();
                        });
                    }
                    else{
                        res.status(HttpStatus.UNAUTHORIZED);
                        res.send("Incorrect password, you may not be the owner of this post");
                        connection.release();
                    }
                }
            });
        }
    });
});

module.exports = router;
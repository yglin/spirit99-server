var express = require('express');
var HttpStatus = require('http-status-codes');

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

// Set up connection to mysql DB
var mysql = require('mysql');
if(process.env.NODE_ENV == 'production'){
  var db = mysql.createConnection({
    host     : 'aa1ldh0f8yn0wcq.c9n0qaroyipe.ap-northeast-1.rds.amazonaws.com',
    user     : 'spirit99',
    password : 'ru.3g6ru.3gp6',
    port     : 3306,
    database : 'nuclear_waste'
  });
}
else{
  var db = mysql.createConnection({
    host: 'localhost',
    database: 'nuclear_waste',
    user: 'yglin',
    password: 'Mlanser0419'
  });    
}

var router = express.Router();
 
router.get('/', function(req, res){
    var sql = 'SELECT ';
    
    if('fields' in req.query && Array.isArray(req.query.fields)){
        sql += mysql.format('??', [req.query.fields]);
    }
    else{
        sql += '*';
    }

    sql += '%extraAliases% FROM `post` %whereStatement% %havingStatement% ORDER BY `id` %limitStatement%';

    var extraAliases = '';
    var whereStatement = '';
    var havingStatement = '';
    var limitStatement = '';

    if('bounds' in req.query){
        var bounds = JSON.parse(req.query.bounds);
        // console.log(bounds);
        var latMin, latMax, lngMin, lngMax;
        if(bounds.northeast.latitude > bounds.southwest.latitude){
            latMin = bounds.southwest.latitude;
            latMax = bounds.northeast.latitude;
        }
        else{
            latMax = bounds.southwest.latitude;
            latMin = bounds.northeast.latitude;            
        }
        if(bounds.northeast.longitude > bounds.southwest.longitude){
            lngMin = bounds.southwest.longitude;
            lngMax = bounds.northeast.longitude;
        }
        else{
            lngMax = bounds.southwest.longitude;
            lngMin = bounds.northeast.longitude;
        }
        whereStatement = 'WHERE '
            + '`latitude` > ' + latMin + ' AND `latitude` < ' + latMax + ' AND '
            + '`longitude` > ' + lngMin + ' AND `longitude` < ' + lngMax;
    }

    if('filterCircle' in req.query){
        var filterCircle = JSON.parse(req.query.filterCircle);
        // This formula for filtering geo locations in a circle area
        // is copied from
        // http://stackoverflow.com/questions/8850336/radius-of-40-kilometers-using-latitude-and-longitude 
        var distanceAlias = '( 6371 * acos( cos( radians(' + filterCircle.center.latitude;
        distanceAlias += ') ) * cos( radians( `latitude` ) ) * cos( radians( `longitude` )';
        distanceAlias += '- radians(' + filterCircle.center.longitude;
        distanceAlias += ') ) + sin( radians(' + filterCircle.center.latitude;
        distanceAlias += ') ) * sin( radians( `latitude` ) ) ) ) AS distance';
        extraAliases = ', ' + distanceAlias;
        havingStatement = 'HAVING distance <= ' + (filterCircle.radius / 1000.0);
    }

    if('pageOffset' in req.query && 'pageSize' in req.query){
        limitStatement = 'LIMIT ' + req.query.pageOffset + ',' + req.query.pageSize;
    }

    sql = sql.replace('%extraAliases%', extraAliases);
    sql = sql.replace('%whereStatement%', whereStatement);
    sql = sql.replace('%havingStatement%', havingStatement);
    sql = sql.replace('%limitStatement%', limitStatement);
    // console.log(sql);
    db.query(sql, function (error, results, fields){
        if(error){
            console.error(error);
            res.status(HttpStatus.INTERNAL_SERVER_ERROR);
            res.json(error);
        }
        else{
            var links = {};
            if('pageOffset' in req.query && 'pageSize' in req.query){
                var fullReqUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
                var pageOffset = parseInt(req.query.pageOffset);
                var pageSize = parseInt(req.query.pageSize);
                if(pageOffset - pageSize >= 0){
                    links['prev-page'] = fullReqUrl + '?pageOffset=' + (pageOffset - pageSize) + '&pageSize=' + pageSize;
                }
                if(results.length == pageSize){
                    links['next-page'] = fullReqUrl + '?pageOffset=' + (pageOffset + pageSize) + '&pageSize=' + pageSize;
                }
                // Build prev/next page link
            }
            res.links(links);
            res.json(results);
        }
    });
});

router.get('/:post_id', function(req, res){
    // console.log(req);
    var sql = 'SELECT ';
    if('fields' in req.query && Array.isArray(req.query.fields)){
        sql += mysql.format('??', [req.query.fields]);
    }
    else{
        sql += '*';
    }
    sql += mysql.format(' FROM `post` WHERE `id`=? LIMIT 1', [req.params.post_id]);
        
    db.query(sql, function (error, results, fields){
        if(error){
            console.log(error);
            res.status(HttpStatus.INTERNAL_SERVER_ERROR);
            res.json(error);
        }
        else{
            var fullReqUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
            res.links({
                comment: fullReqUrl + '/comment',
            });
            res.json(results[0]);
        }
    });
});

router.post('/', function(req, res){
    // console.log(req.body);
    if('id' in req.body){
        db.query('SELECT * FROM `post` WHERE `id`=? LIMIT 1', [req.body.id], function (error, results, fields){
            if(error){
                res.status(HttpStatus.INTERNAL_SERVER_ERROR);
                res.send(error);
                console.log(error);
            }
            else{
                var post = results[0];
                if(!('password' in req.body)
                || req.body.password === null
                || decrypt(req.body.password, serverKeycode) != post.password){
                    res.status(HttpStatus.UNAUTHORIZED);
                    res.send("Incorrect password, you may not be the owner of this post");
                    return;
                }
                for(var key in post){
                    if(key in req.body && key != 'id' && key != 'create_time' && key != 'password'){
                        post[key] = req.body[key];
                    }
                }
                post.modify_time = (new Date()).toISOString().substring(0, 19).replace('T', ' ');
                db.query('UPDATE `post` SET ? WHERE `id`=?', [post, req.body.id],
                function (error, results) {
                    if(error){
                        res.status(HttpStatus.INTERNAL_SERVER_ERROR);
                        res.send(error);
                        console.log(error);
                    }
                    else{
                        // console.log(post);
                        post.modify_time = new Date(post.modify_time);
                        res.json(post);
                    }
                });
            }
        });    
    }
    else{
        // Create new post.
        
        // Create a random password
        var password;
        try{
            password = crypto.randomBytes(128).toString('hex');
        } catch(ex){
            password = encrypt('@九十九神, ' + (new Date()).toISOString(), serverKeycode);
        }

        // console.log(password);
        db.query('INSERT INTO `post` SET ?, `password`=?', [req.body, password],
        function (error, result){
            if(error){
                res.status(HttpStatus.INTERNAL_SERVER_ERROR);
                res.json(error);
                console.log(error);
            }
            else{
                db.query('SELECT * FROM `post` WHERE `id`=?', [result.insertId],
                    function (error, results) {
                        if(error){
                            res.status(HttpStatus.INTERNAL_SERVER_ERROR);
                            res.json(error);
                            console.log(error);
                        }
                        else{
                            res.status(HttpStatus.CREATED);
                            var post = results[0];
                            post.password = encrypt(post.password, serverKeycode);
                            res.json(post);                        
                        }
                });
            }        
        });
    }
});

router.delete('/:post_id', function (req, res) {
    db.query('SELECT * FROM `post` WHERE `id`=? LIMIT 1', [req.params.post_id],
    function (error, results, fields){
        if(error || results.length <= 0){
            res.status(HttpStatus.NOT_FOUND);
            res.send(error);
            console.log(error);
        }
        else{
            var password = req.get('password');
            if(password){
                var post = results[0];
                if(decrypt(password, serverKeycode) == post.password){
                    db.query('DELETE FROM `post` WHERE `id`=? LIMIT 1', [req.params.post_id],
                    function (error, results) {
                        if(error){
                            res.status(HttpStatus.INTERNAL_SERVER_ERROR);
                            res.json(error);
                            console.log(error);
                        }
                        else{
                            res.send(results);
                        }
                    });
                }
                else{
                    res.status(HttpStatus.UNAUTHORIZED);
                    res.send("Incorrect password, you may not be the owner of this post");                
                }
            }
            else{
                res.status(HttpStatus.UNAUTHORIZED);
                res.send("Incorrect password, you may not be the owner of this post");        
            }
        }
    });
});

router.put('/:post_id', function (req, res) {
    // console.log(req.body);
    db.query('SELECT * FROM `post` WHERE `id`=? LIMIT 1', [req.params.post_id], function (error, results, fields){
        if(error){
            res.status(HttpStatus.INTERNAL_SERVER_ERROR);
            res.send(error);
            console.log(error);
        }
        else{
            if(results.length <= 0){
                res.status(HttpStatus.NOT_FOUND);
                res.send("Can not find post with id = " + req.params.post_id);
                return;                
            }

            var post = results[0];
            for(var key in ['title', 'icon', 'author', 'context']){
                if(key in req.body){
                    post[key] = req.body[key];
                }
            }
            post.modify_time = (new Date()).toISOString().substring(0, 19).replace('T', ' ');
            db.query('UPDATE `post` SET ? WHERE `id`=?', [post, req.params.post_id],
            function (error, results) {
                if(error){
                    res.status(HttpStatus.INTERNAL_SERVER_ERROR);
                    res.send(error);
                    console.log(error);
                }
                else{
                    console.log(post);
                    res.json(post);
                }
            });
        }
    });    
});

router.get('/:post_id/comments', function (req, res) {
    db.query('SELECT * FROM `comment` WHERE `post_id`=?', [req.params.post_id], function (error, results, fields) {
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
    db.query('INSERT INTO `comment` SET ?', req.body,
        function(error, result){
            if(error){
                res.status(HttpStatus.INTERNAL_SERVER_ERROR);
                res.json(error);
            }
            else{
                db.query('SELECT * FROM `comment` WHERE `id`=?', result.insertId,
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

router.get('/:post_id/statistics', function (req, res) {
    db.query('SELECT * FROM `statistic` WHERE `post_id`=?' , req.params.post_id,
    function (error, results) {
        if(error){
            console.log(error);
            res.status(HttpStatus.INTERNAL_SERVER_ERROR);
            res.send(error);
        }
        else{
            res.json(results);
        }
    });
});

router.post('/:post_id/statistics', function (req, res) {
    req.body.post_id = req.params.post_id;
    db.query('INSERT INTO `statistic` SET ?', req.body,
        function(error, result){
            if(error){
                console.log(error);
                res.status(HttpStatus.INTERNAL_SERVER_ERROR);
                res.json(error);
            }
            else{
                db.query('SELECT * FROM `statistic` WHERE `id`=?', result.insertId,
                    function (error, results) {
                        if(error){
                            console.log(error);
                            res.status(HttpStatus.INTERNAL_SERVER_ERROR);
                            res.json(error);                        
                        }
                        else{
                            console.log(error);
                            res.status(HttpStatus.CREATED);
                            res.json(results[0]);
                        }
                });
            }        
    });
});

router.put('/:post_id/statistics/:id', function (req, res) {
    db.query('UPDATE `statistic` SET `count` = `count` + 1 WHERE `id` = ?', [req.params.id],
    function (error, results) {
        if(error){
            console.log(error);
            res.status(HttpStatus.INTERNAL_SERVER_ERROR);
            res.send(error);            
        }
        else{
            db.query('SELECT * FROM `statistic` WHERE `id` = ?', [req.params.id],
            function (error, results) {
                if(error){
                    console.log(error);
                    res.status(HttpStatus.INTERNAL_SERVER_ERROR);
                    res.send(error);                        
                }
                else{
                    res.json(results[0]);
                }
            });
        }
    });
});

router.delete('/:post_id/statistics/:id', function (req, res) {
    db.query('SELECT * FROM `post` WHERE `id`=? LIMIT 1', [req.params.post_id],
    function (error, results, fields){
        if(error || results.length <= 0){
            res.status(HttpStatus.NOT_FOUND);
            res.send(error);
            console.log(error);
        }
        else if('password' in req.query){
            var post = results[0];
            if(decrypt(req.query.password, serverKeycode) == post.password){
                db.query('DELETE FROM `statistic` WHERE `id`=? LIMIT 1', [req.params.id],
                function (error, results) {
                    if(error){
                        res.status(HttpStatus.INTERNAL_SERVER_ERROR);
                        res.json(error);
                        console.log(error);
                    }
                    else{
                        res.send(results);
                    }
                });
            }
            else{
                res.status(HttpStatus.UNAUTHORIZED);
                res.send("Incorrect password, you may not be the owner of this post");                
            }
        }
        else{
            res.status(HttpStatus.UNAUTHORIZED);
            res.send("Incorrect password, you may not be the owner of this post");        
        }
    });

});

module.exports = router;
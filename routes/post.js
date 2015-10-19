var express = require('express');
var HttpStatus = require('http-status-codes');
var mysql = require('mysql');

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

    req.app.mysqlPoolCluster.getConnection(req.station, function (error, connection) {
        if(error){
            console.log(error);
            res.status(HttpStatus.INTERNAL_SERVER_ERROR);
            res.send(error);
        }
        else{
            connection.query(sql, function (error, results, fields){
                if(error){
                    console.error(error);
                    res.status(HttpStatus.INTERNAL_SERVER_ERROR);
                    res.send(error);
                }
                else if(results.length <= 0){
                    res.status(HttpStatus.NOT_FOUND).end();
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
                connection.release();
            });
        }
    });
});

router.get('/:id', function(req, res){
    // console.log(req);
    var sql = 'SELECT ';
    if('fields' in req.query && Array.isArray(req.query.fields)){
        sql += mysql.format('??', [req.query.fields]);
    }
    else{
        sql += '*';
    }
    sql += mysql.format(' FROM `post` WHERE `id`=? LIMIT 1', [req.params.id]);

    req.app.mysqlPoolCluster.getConnection(req.station, function (error, connection) {
        if(error){
            console.log(error);
            res.status(HttpStatus.INTERNAL_SERVER_ERROR);
            res.send(error);
        }
        else{
            connection.query(sql, function (error, results, fields){
                if(error){
                    console.log(error);
                    res.status(HttpStatus.INTERNAL_SERVER_ERROR);
                    res.send(error);
                }
                else if(results.length <= 0){
                    res.status(HttpStatus.NOT_FOUND).end();
                }
                else{
                    var fullReqUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
                    res.links({
                        comment: fullReqUrl + '/comment',
                    });
                    res.json(results[0]);
                }
                connection.release();
            });
        }
    });
});

router.post('/', function (req, res){
    // Create new post.    
    // Create a random password
    var password;
    try{
        password = crypto.randomBytes(128).toString('hex');
    } catch(ex){
        password = encrypt('@九十九神, ' + (new Date()).toISOString(), serverKeycode);
    }

    req.app.mysqlPoolCluster.getConnection(req.station, function (error, connection) {
        if(error){
            console.log(error);
            res.status(HttpStatus.INTERNAL_SERVER_ERROR);
            res.send(error);
        }
        else{
            connection.query('INSERT INTO `post` SET ?, `password`=?', [req.body, password],
            function (error, result){
                if(error){
                    res.status(HttpStatus.INTERNAL_SERVER_ERROR);
                    res.send(error);
                    console.log(error);
                    connection.release();
                }
                else{
                    connection.query('SELECT * FROM `post` WHERE `id`=?', [result.insertId],
                    function (error, results) {
                        if(error){
                            res.status(HttpStatus.INTERNAL_SERVER_ERROR);
                            res.send(error);
                            console.log(error);
                        }
                        else{
                            res.status(HttpStatus.CREATED);
                            var post = results[0];
                            post.password = encrypt(post.password, serverKeycode);
                            res.json(post);                        
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
            connection.query('SELECT * FROM `post` WHERE `id`=? LIMIT 1', [req.params.id],
            function (error, results, fields){
                if(error){
                    res.status(HttpStatus.INTERNAL_SERVER_ERROR);
                    res.send(error);
                    console.log(error);
                    connection.release();
                }
                else if(results.length <= 0){
                    res.status(HttpStatus.NOT_FOUND).end();
                    connection.release();
                }
                else{
                    var post = results[0];
                    if(!('password' in req.body) || req.body.password === null
                    || decrypt(req.body.password, serverKeycode) != post.password){
                        res.status(HttpStatus.UNAUTHORIZED);
                        res.send("Incorrect password, you may not be the owner of this post");
                        connection.release();
                    }
                    else{
                        for(var key in post){
                            if(key in req.body && key != 'id' && key != 'create_time' && key != 'password'){
                                post[key] = req.body[key];
                            }
                        }
                        post.modify_time = (new Date()).toISOString().substring(0, 19).replace('T', ' ');
                        req.db.query('UPDATE `post` SET ? WHERE `id`=?', [post, req.params.id],
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
                            connection.release();
                        });                        
                    }
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
            connection.query('SELECT * FROM `post` WHERE `id`=? LIMIT 1', [req.params.id],
            function (error, results){
                if(error || results.length <= 0){
                    res.status(HttpStatus.NOT_FOUND);
                    res.send(error);
                    console.log(error);
                    connection.release();
                }
                else{
                    var password = req.get('password');
                    var post = results[0];
                    if(password && decrypt(password, serverKeycode) == post.password){
                        connection.query('DELETE FROM `post` WHERE `id`=? LIMIT 1', [req.params.id],
                        function (error, results) {
                            if(error){
                                res.status(HttpStatus.INTERNAL_SERVER_ERROR);
                                res.send(error);
                                console.log(error);
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
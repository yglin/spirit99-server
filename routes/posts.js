var express = require('express');
var HttpStatus = require('http-status-codes');
var mysql = require('mysql');
var router = express.Router();

router.get('/', function(req, res){
    var sql = 'SELECT ';
    
    if(Array.isArray(req.query.fields)){
        sql += mysql.format('??', [req.query.fields]);
    }
    else{
        sql += '*';
    }

    sql += '%extraAliases% FROM `story` %whereStatement% %havingStatement% ORDER BY `id` %limitStatement%';

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
    req.db.query(sql, function (error, results, fields){
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
    if('id' in req.body){
        console.log(req.body);
        req.db.query('SELECT * FROM `story` WHERE `id`=? LIMIT 1', [req.body.id], function (error, results, fields){
            if(error){
                res.status(HttpStatus.INTERNAL_SERVER_ERROR);
                res.send(error);
                console.log(error);
            }
            else{
                var post = results[0];
                for(var key in post){
                    if(key in req.body && key != 'id' && key != 'create_time'){
                        post[key] = req.body[key];
                    }
                }
                post.modify_time = (new Date()).toISOString().substring(0, 19).replace('T', ' ');
                req.db.query('UPDATE `story` SET ? WHERE `id`=?', [post, req.body.id],
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
        req.db.query('INSERT INTO `story` SET ?', req.body, function (error, result){
            if(error){
                res.status(HttpStatus.INTERNAL_SERVER_ERROR);
                res.json(error);
                console.log(error);
            }
            else{
                db.query('SELECT * FROM `story` WHERE `id`=?', [result.insertId],
                    function (error, results) {
                        if(error){
                            res.status(HttpStatus.INTERNAL_SERVER_ERROR);
                            res.json(error);
                            console.log(error);
                        }
                        else{
                            res.status(HttpStatus.CREATED);
                            res.json(results[0]);                        
                        }
                });
            }        
        });
    }
});

router.put('/:post_id', function (req, res) {
    console.log(req.body);
    req.db.query('SELECT * FROM `story` WHERE `id`=? LIMIT 1', [req.params.post_id], function (error, results, fields){
        if(error){
            res.status(HttpStatus.INTERNAL_SERVER_ERROR);
            res.send(error);
            console.log(error);
        }
        else{
            var post = results[0];
            for(var key in ['title', 'icon', 'author', 'context']){
                if(key in req.body){
                    post[key] = req.body[key];
                }
            }
            post.modify_time = (new Date()).toISOString().substring(0, 19).replace('T', ' ');
            req.db.query('UPDATE `story` SET ? WHERE `id`=?', [post, req.params.post_id],
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

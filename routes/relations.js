var express = require('express');
var HttpStatus = require('http-status-codes');
var mysql = require('mysql');
var router = express.Router();

router.post('/', function(req, res){
    console.log(req.body);
    if('postIDs' in req.body && Array.isArray(req.body.postIDs)
    && req.body.postIDs.length >= 2 && req.body.postIDs[0] != req.body.postIDs[1]){
        var post_id1 = req.body.postIDs[0] < req.body.postIDs[1] ? req.body.postIDs[0] : req.body.postIDs[1];
        var post_id2 = req.body.postIDs[0] > req.body.postIDs[1] ? req.body.postIDs[0] : req.body.postIDs[1];
        req.db.query('SELECT * FROM `relation` WHERE `post_id1`=? AND `post_id2`=?', [post_id1, post_id2],
        function (error, results) {
            if(error){
                console.log(error);
            }
            else if(results.length > 0){
                // Relation exists, just increment the count
                var result = results[0];
                result.count += 1;
                if('comment' in req.body){
                    result.comments = JSON.stringify(JSON.parse(result.comments).push(req.body.comment));
                }
                req.db.query('UPDATE `relation` SET ? WHERE `post_id1`=? AND `post_id2`=?',
                [result, result.post_id1, result.post_id2],
                function (error) {
                    if(error){
                        res.status(HttpStatus.INTERNAL_SERVER_ERROR);
                        res.send(error);
                    }
                    else{
                        res.json(result)
                    }
                });
            }
            else{
                // Relation not exists, create it
                var newRelation = {
                    'post_id1': post_id1,
                    'post_id2': post_id2,
                    'count': 1
                };
                if('comment' in req.body && typeof req.body.comment === 'string'){
                    newRelation['comment'] = JSON.stringify([req.body.comment]);
                }
                req.db.query('INSERT INTO `relation` SET ?', newRelation,
                function (error) {
                    if(error){
                        res.status(HttpStatus.INTERNAL_SERVER_ERROR);
                        res.send(error);                        
                    }
                    else{
                        res.json(newRelation);
                    }
                });
            }
        });
    }
    else{
        res.status(HttpStatus.BAD_REQUEST);
        res.send('"postIDs" should be an array containing 2 different INTs, instead received request body is ' + JSON.stringify(req.body));
    }
});

module.exports = router;


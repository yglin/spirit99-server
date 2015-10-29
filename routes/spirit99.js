var express = require('express');
var HttpStatus = require('http-status-codes');
var mysql = require('mysql');

var router = express.Router();

router.post('/issues', function (req, res) {
    var issueData = req.body;
    issueData.client_ip = req.clientIp;
    issueData.user_agent = req.headers['user-agent'];
    issueData.error_logs = JSON.stringify(req.body.error_logs);

    // console.log(issueData);
    req.app.mysqlPoolCluster.getConnection('spirit99', function (error, connection) {
        if(error){
            console.log(error);
            res.status(HttpStatus.INTERNAL_SERVER_ERROR);
            res.send(error);
        }
        else{
            var sql = mysql.format('INSERT INTO `issue` SET ?', [issueData]);
            // console.log(sql);
            connection.query(sql,
            function (error, result){
                if(error){
                    console.log(error);
                    res.status(HttpStatus.INTERNAL_SERVER_ERROR);
                    res.send(error);                
                }
                else{
                    res.status(HttpStatus.CREATED);
                    res.end();
                }
                connection.release();
            });
        }
    });
});

router.get('/issues', function (req, res) {
    // console.log(issueData);
    req.app.mysqlPoolCluster.getConnection('spirit99', function (error, connection) {
        if(error){
            console.log(error);
            res.status(HttpStatus.INTERNAL_SERVER_ERROR);
            res.send(error);
        }
        else{
            connection.query('SELECT * FROM `issue`',
            function (error, results) {
                if(error){
                    console.log(error);
                    res.status(HttpStatus.INTERNAL_SERVER_ERROR);
                    res.send(error);                    
                }
                else{
                    results.forEach(function (issue, index) {
                        issue.error_logs = JSON.parse(issue.error_logs);
                    });
                    res.json(results);
                }
            })
        }
    });
});

module.exports = router;
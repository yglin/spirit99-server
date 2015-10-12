var express = require('express');
var router = express.Router();
var mysql = require('mysql');

router.use(function (req, res, next) {
    // Set up connection to mysql DB
    if(process.env.NODE_ENV == 'production'){
      req.db = mysql.createConnection({
        host     : process.env.DB_HOST,
        user     : process.env.DB_USER,
        password : process.env.DB_PASSWORD,
        port     : process.env.DB_PORT,
        database : 'nuclear_waste'
      });
    }
    else{
      req.db = mysql.createConnection({
        host: 'localhost',
        user: 'yglin',
        password: 'turbogan',
        database: 'nuclear_waste',
      });    
    }
    next();
});

router.use('/portal', require('./portal'));
router.use('/posts', require('./post'));

module.exports = router;

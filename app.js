var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var HttpStatus = require('http-status-codes');
var mysql = require('mysql');
var requestIp = require('request-ip');

// Routers
var routes = require('./routes/index');
var spirit99 = require('./routes/spirit99');
// var users = require('./routes/users');
// var portal = require('./routes/portal');
// var post = require('./routes/post');


var app = express();

app.stations = require('./stations.json');

console.log('NODE_ENV = ' + process.env.NODE_ENV);
console.log('Stations data: ');
console.log(app.stations);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Set app global vars
app.set('static_path', path.join(__dirname, 'public'));


// Set database connection options
if(process.env.NODE_ENV == 'production'){
  var dbOptions = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    connectionLimit: 100
    // ssl: 'Amazon RDS'
  };
}
else{
  var dbOptions = {
    host: 'localhost',
    user: 'yglin',
    password: 'turbogan',
    connectionLimit: 100
  };    
}

// Create mysql pool clusters
app.mysqlPoolCluster = mysql.createPoolCluster();
dbOptions.database = 'spirit99';
app.mysqlPoolCluster.add('spirit99', dbOptions);
for(var name in app.stations){
  dbOptions.database = app.stations[name].database;
  app.mysqlPoolCluster.add(name, dbOptions);
}

// Add headers for restful access
app.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, HEAD, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'origin, x-http-method-override, accept, content-type, authorization, x-pingother, if-match, if-modified-since, if-none-match, if-unmodified-since, x-requested-with, password');

    res.setHeader('Access-Control-Expose-Headers', 'tag, link, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, X-OAuth-Scopes, X-Accepted-OAuth-Scopes');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});

// Get client ip address
app.use(function (req, res, next) {
    req.clientIp = requestIp.getClientIp(req);
    next();
});

app.use('/spirit99', spirit99);

app.use('/:station', function (req, res, next) {
    if(req.params.station && req.params.station in app.stations){
        req.station = req.params.station;
        next();
    }
    else{
        res.status(HttpStatus.NOT_FOUND);
        res.send('Can not found station: ' + req.params.station);
    }
}, routes);

// app.use('/', routes);
// app.use('/users', users);
// app.use('/portal', portal);
// app.use('/posts', post);
// app.use('/nuclear-waste', require('./routes/nuclear-waste/index'));
// app.use('/localooxx', require('./routes/localooxx/index'));


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;

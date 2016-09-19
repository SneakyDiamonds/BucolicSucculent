var express = require('express');
var bodyParser = require('body-parser');
var http = require('http')
var cookieParser = require('cookie-parser');
var morgan = require('morgan');
var facebookPassport = require('./config/facebookAuth');
var passport = require('passport');
var helpers = require('./config/helpers');



var app = express();
var server = require('http').Server(app);
var io = require('socket.io').listen(server)

app.use(express.static('./dist'));
app.use(morgan('dev'));
app.use(bodyParser.json());
/* ==== grab facebook profile to save to database ==== */
facebookPassport(app);

/* === connect database to server === */
var db = require('./config/db-config').db;

db.authenticate().then(function (err) {
 if (err) {
    console.log('sequelize authenticate ERROR');
 } else {
    console.log('Connection has been established successfully');
 }
});

/* IF YOU ARE WORKING WITH THIS CODE BASE FOR THE FIRST TIME, TO SET UP DATA BASE
MAKE SURE YOU ADD 'SCAVENGER' TO MY SQL DATABASE! THEN UNCOMMENT BELOW CODE TO FORCE
DATABASE UPDATE! RECOMMENT AFTER YOU USE 'NPM START' ONCE. THEN RESTART YOUR SERVER 
AFTER RECOMMENTING BELOW CODE. */
// db
//   .sync({ force: true })
//   .then(function(err) {
//     console.log('It worked!');
//   }, function (err) { 
//     console.log('An error occurred while creating the table:', err);
//   });

// ========= facebook authentication ========= //
app.get('/auth/facebook', function(req, res, next){
  console.log(req, 'facebook request');
  next();
}, passport.authenticate('facebook'));

app.get('/auth/facebook/callback', 
  passport.authenticate('facebook', { failureRedirect: 'http://localhost:4200/#/login' }),
  helpers.updateUser
  // function(req, res) {
  //   // console.log('passport auth req.user added to req?', req);
  //   //console.log('LOGIN SUCCESS NOW SHOW ME THE USER---------------------->', req.user);
  //   //console.log('SHOW ME WHAT THIS SESSION IS------------>', req.session.passport.user);
  //   res.redirect('http://localhost:4200/#/dashboard/');
  // }
  );


require('./config/router')(app, express);

var port = app.get('env') === 'development' ? 3000 : 80;


// socket connection
io.sockets.on('connection', require('./sockets/socketsConfig'));



server.listen(port, function () {
  console.log('Server listening on port ' + port +'!');
  db.sync().then(function() {
    // console.log('Synced with mySql');
  });
});

module.exports = {
  server: server,
  io: io
};

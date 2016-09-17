var url = require('url')
var User = require('./db-config').User;
var jwt = require('jwt-simple');
var moment = require('moment');
var settings = require('../../settings').token;

exports.jwtAuth = function(req, res, next) {

  // token is passed in the x-access-token header
  var token = req.headers['x-access-token'];

  if (token) {
    var decoded = jwt.decode(token, settings.secret);
    if (decoded) {
      // check expiration date
      if (decoded.exp <= Date.now()) {
        res.end('Access token has expired', 400);
      }
      // get user data and attach
      User.findOne({ where: { 'id': decoded.iss } }).then(function(user) {
        if (user) {
          req.user = user;
          return next();
        }
      });
    } else {
      // token didn't decode
      return next();
    }
  } else {
    // no token recieved
    next();
  }
};

exports.requireAuth = function(req, res, next) {
  //jwt adds user struct to req - if not there user was not validated
  if (!req.user.username) {
    res.end('Not authorized', 401);
  } else {
    next();
  }
};

exports.createToken = function (user, cb) {
  // has successfully authenticated, send a token
  var expires = moment().add(7, 'days').valueOf();
  var token = jwt.encode(
    {
      iss: user.dataValues.id,
      exp: expires
    }, 
    settings.secret
  );
  cb ({
    token: token,
    user: user.dataValues.username,
    facebookavatar: user.facebookavatar,
    facebookname: user.facebookname,
  });
};
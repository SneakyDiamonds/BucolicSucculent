var helpers = require('./helpers');
var jwtAuth = require('./jwt').jwtAuth;
var requireAuth = require('./jwt').requireAuth;

module.exports = function(app, express) {

  var detectEnvironment = function(req, res) {
    var env = app.get('env');
    var host = env === 'development' ? '127.0.0.1' : '138.68.53.22';
    var port = env === 'development' ? '4200' : '';
    var fullUrl = 'http://' + host + ':' + port + '/#/game/' + req.pathUrl + '/map';
    res.send(fullUrl);
  };

  /**** for production with authentication ****/
  app.route('/api/game')
    .get(jwtAuth, requireAuth, helpers.joinGame)
    .put(jwtAuth, requireAuth, helpers.updateStatus)
    .post(jwtAuth, requireAuth, helpers.createGame, detectEnvironment);

  /**** for development and testing to bypass authentication ****/
  // app.route('/api/game')
  //   .get(helpers.joinGame)
  //   .put(helpers.updateStatus)
  //   .post(helpers.createGame, detectEnvironment);

  app.route('/api/public')
    .get(jwtAuth, requireAuth, helpers.getPublicGames)
    .post(jwtAuth, requireAuth, helpers.createPublicGame, detectEnvironment);




  app.post('/api/users/signup', helpers.createUser);

  app.post('/api/users/login', helpers.loginUser);

  app.get('/user/facebook', helpers.getUserFacebook);

  app.get('/api/publicgameuserdata', helpers.getPublicGameUserData);
  
};


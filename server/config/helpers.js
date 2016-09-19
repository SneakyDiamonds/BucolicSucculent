var Game = require('./db-config').Game;
var Location = require('./db-config').Location;
var Status = require('./db-config').Status;
var User = require('./db-config').User;
var Utils = require('./utils');
var jwt = require('./jwt');
var md5 = require('md5');


exports.joinGame = function(req, res) {

  // do a query for pathUrl and username
  // return the game info for username

  if (req.query.path && req.query.username) {
    //Looks in usergame table to see if player is in game
    Game.findOne({
      where: { path: req.query.path },
      include: {
        model: User,
        where: { username: req.query.username },
      }
    }).then(function (gameFound) {
      if (!gameFound) {
        //if the user is new to game, have player join the game and generate statuses
        generateStatuses(req, res);
      } else {
        // if user already started the game, return their saved statuses
        returnStatuses(req, res, gameFound);
      }
    });
  } else {
    // if query only includes the username
    if (req.query.username) {
      // return all the games and game info associated to that user
      returnGamesforUser(req, res);
    } else {
      if (req.query.path) {
        // if query only includes the path, return game info on all other users in the game
        returnOtherPlayers(req, res);
      } else {
        // if path or username is not provided, it is an invalid query
        res.status(400).send('Invalid query');
      }
    }
  }
};

exports.updateStatus = function (req, res) {

  User.findOne({ where: { username: req.user.username } })        // for production with authentication
  // User.findOne({ where: { username: req.body.username } })     // bypass auth for testing with postman
  .then(function (currentUser) {
    return Status.findOne({
      where: {
        userId: currentUser.id,
        locationId: req.body.locationId
      }
    });
  })
  .then(function(currentStatus) {
    return currentStatus.update({ status: true });
  })
  .then(function(result) {
    res.send(result);
  });
};

exports.createPublicGame = function(req, res, next) {

  var creator = req.user.username;      // for production with authentication
  // var creator = req.body.username;      // bypass auth for testing with postman

  // generate pathUrl Hash
  var pathUrl = md5(JSON.stringify(req.body)).slice(0, 5);

  var locations = req.body.markers;
  console.log(locations, 'locations, locations locations')
 

  User.findOne({ where: { username: creator } })
  // Find the creator in the User table
  .then(function(currentUser) {
    // then create a Game and its locations
    return Game.create({
      path: pathUrl,
      public: 1,
      locations: locations
    }, { include: [Location] })
    .then(function(game) {
      // then set the creatorId foreign key for the Game
      return game.setCreator(currentUser);
    });
  })
  .then(function() {
    // when finished, send back the pathUrl
    req.pathUrl = pathUrl;
    next();
  });

};

exports.getPublicGames = function(req, res, next) {

  console.log('i hit getPublicGames on the server side!!! YAY!!!!');

  Game.findAll({
    where: {public: 1}
  }).then(function(games) {
    console.log('checking if im getting any games back', games);
    res.status(202).send(games);
  });
};

exports.getPublicGameUserData = function(req, res, next) {

  console.log('i hit getPublicGameUserData on the server side!!! WOOT WOOT!!!!');

  Game.findAll({

    where: {
      public: 1
    },
    include: {
      model: User,
      attributes: ['username']
    }
  }).then(function(data) {
    console.log('what is data in my getPublicGameUserData', data);
    res.status(202).send(data);
  });


};

exports.createGame = function(req, res, next) {

  // Example Data Structure
  // { 
  //   'markers': [
  //     { latitude: 1.23, longitude: 2.34, sequence: 1},
  //     { latitude: 3.45, longitude: 4.56, sequence: 2},
  //     { latitude: 5.67, longitude: 6.78, sequence: 3},
  //     { latitude: 7.89, longitude: 8.90, sequence: 4} ]
  // };

  var creator = req.user.username;      // for production with authentication
  // var creator = req.body.username;      // bypass auth for testing with postman

  // generate pathUrl Hash
  var pathUrl = md5(JSON.stringify(req.body)).slice(0, 5);

  var locations = req.body.markers;

  var latlon =  locations.map(function(obj){
    return {latitude: obj.location.lat, longitude: obj.location.lng};
  })

  User.findOne({ where: { username: creator } })
  // Find the creator in the User table
  .then(function(currentUser) {
    // then create a Game and its locations
    return Game.create({
      path: pathUrl,
      public: 0,
      locations: latlon
    }, { include: [Location] })
    .then(function(game) {
      // then set the creatorId foreign key for the Game
      return game.setCreator(currentUser);
    });
  })
  .then(function() {
    // when finished, send back the pathUrl
    req.pathUrl = pathUrl;
    next();
  });
};
//===== facebook auth to get user info =====//
exports.updateUser = function(req, res) {
  console.log('inside helpers.js updateUser fb info', req);

  var facebookid = req.user.facebookid;
  var facebookavatar = req.user.facebookavatar;
  var facebookemail = req.user.facebookemail;
  var facebookname = req.user.facebookname; 
  
  User.update({
      facebookid: facebookid,
      facebookavatar: facebookavatar,
      facebookemail: facebookemail,
      facebookname: facebookname
    }, {
      where: {username: 'mike'} //<===hard coded 
  })
  .then(function(user){
    console.log(user, 'hopefully updated user');
    res.redirect('http://localhost:4200/#/dashboard/');
    //res.send(200);
  })
  .catch(function(error){
    console.log(error);
    //res.send(400);
  })
}

exports.getUserFacebook = function(req, res) {
  if(req.query.username){
    User.findOne({username: req.query.username})
    .then(function(user){
      res.send(user)
    })
    .catch(function(err){
      console.log('helpers.getUserFacebook err');
    })  
  } else {
    // redirect?
  }
}
// ====== end facebook auth ====== //

exports.createUser = function(req, res) {
  if (req.headers.username && req.headers.password) {   
    var user = {
      username: req.headers.username.toLowerCase(),
      password: req.headers.password
    };
    
    // create it
    Utils.encryptPassword(user, function(err, user) {
      User.create(user)
      .then(function(user) {
        // create token and return
        jwt.createToken(user, function(token) {
          if ( token.token ) {
            res.status(201).send(token);
          } else {
            res.status(401).send('Token error');
          }
        });  
      })
      .catch(function(err) {
        res.status(409).send('Username already exists or other err: ' + err);
      });
    });
  } else {
    // missing username or password
    res.status(401).send('missing username or password');
  }
};

exports.loginUser = function(req, res) {
  if (req.headers.username && req.headers.password) {      
    // Fetch the appropriate user, if they exist

    User.findOne({where: { username: req.headers.username }})
    .then(function(user) {
      console.log('user findOne serverside', user);
      if (user) {
        Utils.comparePassword(req.headers.password, user, function(err, isMatch) {
          // bad password
          if (err) { return res.status(401).send('Authentication error'); }

          // has successfully authenticated, send a token
          if (isMatch) {
            jwt.createToken(user, function(token) {
              console.log('token,token', token)
              if ( token.token ) {
                res.status(200).send(token);
              } else {
                res.status(401).send('Token error');
              }
            });   
          } else {            
            res.status(401).send('Authentication error');
          }
        }); // comparePassword
      } else { // User does not exist in db.
        res.status(401).send('Authentication error');
      }
    }) // .then findOne
    .error(function(err) {   
      res.status(401).send('Authentication error');
    }); // .error findOne
  } else {
    res.status(401).send('Authentication error');
  }
};

var generateStatuses = function(req, res) {
  // Find the current User in the User Table...
  User.findOne({ where: { username: req.query.username } })
  .then(function(currentUser) {
    // Then find the current Game in the Game Table via the given Path
    Game.findOne({ where: { path: req.query.path } })
    .then(function(currentGame){
        // If a game at the path exists...
      if (currentGame) {
        // Add the current User to the current Game
        currentUser.addGame(currentGame);

        // Then find all the locations associated to the current Game...
        Location.findAll({
          include: {
            model: Game,
            where: { path: req.query.path },
          }
        })
        .then(function(allLocs) {
          // Initialize the status of each location for the User
          return currentUser.addLocations(allLocs, { status: false });
        })
        .then(function() {
          // When complete, return Statuses to client.
          returnStatuses(req, res, currentGame);
        });
      } else {
        // if currentGame does not exist, end response and return an 422 error.
        res.status(422).send('Game at URL path does not exist.');
      }
    });
  });
};

var returnStatuses = function(req, res, gameFound) {
  // Find the current User in the User Table
  // With it's associated game and location statuses
  User.findOne({
    attributes: [],
    where: { username: req.query.username },
    include: {
      model: Location,
      attributes: ['id', 'sequence', 'latitude', 'longitude'],
      where: { gameId: gameFound.id },
      through: { attributes: ['status']}
    }
  }).then(function(result) {
    res.send(result);
  });
};

/****** Example data for returnStatuses *****/
// {
//   "locations": [
//     {
//       "id": 117,
//       "sequence": 1,
//       "latitude": 1.243,
//       "longitude": 2.334,
//       "statuses": {
//         "status": false,
//       }
//     },
//     {
//       "id": 118,
//       "sequence": 2,
//       "latitude": 3.345,
//       "longitude": 4.564,
//       "statuses": {
//         "status": true,
//       }
//     }
//   ]
// }

var returnGamesforUser = function(req, res) {
  // Find the current User in the User Table
  // and return all the games associated to the user.
  User.findOne({
    attributes: ['username'],
    where: { username: req.query.username },
    include: {
      model: Game,
      through: {attributes: ['createdAt']},
      attributes: ['id', 'path']
    }
  }).then(function(allGames) {
    res.send(allGames);
  });
};

/****** Example data for returnGamesforUser *****/
// {
//   "username": "beth",
//   "games": [
//     {
//       "id": 14,
//       "path": "9ef63"
//       "usergame": {
//         "createdAt": "2016-09-09T22:07:07.000Z"
//       }
//     },
//     {
//       "id": 15,
//       "path": "3ece8"
//       "usergame": {
//         "createdAt": "2016-09-09T23:05:22.000Z"
//       }
//     }
//   ]
// }

var returnOtherPlayers = function(req, res) {
  // Find all the users/players in the game specified by the path
  // and return each of their locations and statuses.
  User.findAll({
    attributes: ['username'],
    include: {
      model: Location,
      attributes: ['sequence', 'latitude', 'longitude'],
      through: { attributes: ['status'] },
      include: {
        model: Game,
        attributes: [],
        where: { path: req.query.path }
      }
    },
    order: [['username', 'ASC'], [Location, 'sequence', 'ASC']],
  }).then(function(allPlayers) {
    res.send(allPlayers);
  });
};

/****** Example data for returnOtherPlayers *****/
// [
//   {
//     "username": "beth",
//     "locations": [
//       {
//         "sequence": 1,
//         "latitude": 37.78631777032694,
//         "longitude": -122.42096275091171,
//         "statuses": {
//           "status": true
//         }
//       },
//       {
//         "sequence": 2,
//         "latitude": 37.778991539440696,
//         "longitude": -122.44156211614609,
//         "statuses": {
//           "status": false
//         }
//       }
//     ]
//   },
//   {
//     "username": "derek",
//     "locations": [
//       {
//         "sequence": 1,
//         "latitude": 37.78631777032694,
//         "longitude": -122.42096275091171,
//         "statuses": {
//           "status": false
//         }
//       },
//       {
//         "sequence": 2,
//         "latitude": 37.778991539440696,
//         "longitude": -122.44156211614609,
//         "statuses": {
//           "status": true
//         }
//       }
//     ]
//   }
// ]
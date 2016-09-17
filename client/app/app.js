angular.module('app', ['ui.router', 'app.auth', 'app.createGame', 'uiGmapgoogle-maps', 'app.services', 'app.game', 'app.dashboard', 'btford.socket-io'])
.config(['$stateProvider', '$urlRouterProvider', 'uiGmapGoogleMapApiProvider', function ($stateProvider, $urlRouterProvider, uiGmapGoogleMapApiProvider) {

  $urlRouterProvider.otherwise('/dashboard'); // <-------------- default view TODO: SET TO DASHBOARD!

  $stateProvider
    .state('login', {
      url: '/login',
      templateUrl: '../views/login.html',
      controller: 'AuthController'
    })
    .state('signup', {
      url: '/signup',
      templateUrl: '../views/signup.html',
      controller: 'AuthController'
    })
    .state('createGame', {
      url: '/createGame',
      templateUrl: '../views/createGame.html',
      controller: 'createGameController',
      resolve: {
        isAuth: function(Auth) {
          return Auth.isAuth();
        }
      }
    })
    .state('game', {
      url: '/game/:path',
      templateUrl: '../views/game.html',
      controller: 'gameController',
      resolve: {
        isAuth: function(Auth) {
          return Auth.isAuth();
        }
      }
    })
    .state('PublicGames', {
      url: '/public',
      templateUrl: '../views/public.html',
      controller: 'publicController',
      resolve: {

        data: function(Requests) {
          return Requests.getPublicGames().then(function(res) {
            console.log('checking my resolve??????', res);
            return res.data;
          });
        },
        popular: function(Requests) {
          return Requests.getPublicGamesUserData().then(function(res) {
            //console.log('what is my response for getPublicGamesUserData???', res.data);
            return res.data;
          });
        }
      }
    })
    .state('game.map', { //child view of game view ---- link to here on game join
      url: '/map',
      templateUrl: '../views/game.map.html',
      controller: 'gameMapController',
      resolve: {
        data: function($stateParams, Requests, Auth) {
          //Only fetch for gamedata if logged in
          if (!Auth.isAuth()) {
            return [];
          }
          return Requests.getGameData($stateParams.path).then(function(res) {
            return {
              data: res.data.locations,
              gameId: $stateParams.path
            };
          }); 
        }
      }
    })
    .state('game.stats', { //child view of game view
      url: '/stats',
      templateUrl: '../views/game.stats.html',
      controller: 'gameStatsController', 
      resolve: {
        data: function($stateParams, Requests, Auth) {
          //Only fetch for gamedata if logged in
          if (!Auth.isAuth()) {
            return [];
          }
          return Requests.getGameStats($stateParams.path).then(function(res) {
            return res.data;
          }); 
        }
      }
    })
    .state('dashboard', {
      url: '/dashboard',
      templateUrl: '../views/dashboard.html',
      controller: 'dashboardController',
      resolve: {
        isAuth: function(Auth) {
          return Auth.isAuth();
        },
        data: function(Requests, Auth) {
          //Only fetch for data if logged in
          if (!Auth.isAuth()) {
            return [];
          }
          return Requests.getUserData().then(function(res) {
            return Requests.updateFacebookData()
                .then(function(facebookInfo){
                  console.log('crazy callbacks', res, facebookInfo);
                  return {
                    userdata: res.data,
                    userFacebook: facebookInfo.data
                  };
                })
          }); 
        }
      }
    });


      //////////////////// 

  uiGmapGoogleMapApiProvider.configure({
    key: 'AIzaSyDgVf-KYpLw0vF1kUlPK3eZc9clchmpRbM', //<----- apiKey restricted!
    libraries: 'places,drawing,geometry,visualization'
  });
}])
.run(['$rootScope', '$location', 'Auth', '$templateCache', function ($rootScope, $location, Auth, $templateCache) {
  // Hold the HTML template for Google Places API searchbox
  $templateCache.put('searchbox.tpl.html', '<input class="searchbox" type="text" placeholder="Search">');

  $rootScope.signOut = function() {
    Auth.signout();
  };

  // hide navbar game specific options when not applicable
  $rootScope.gameNav = function() {
    return ($location.path() !== '/createGame' && $location.path() !== '/dashboard');
  };

  // hide navbar on login and signup
  $rootScope.hideNav = function() {
    return ($location.path() === '/login' || $location.path() === '/signup');
  };
  // here inside the run phase of angular, our services and controllers
  // have just been registered and our app is ready
  // however, we want to make sure the user is authorized
  // we listen for when angular is trying to change routes
  // when it does change routes, we then look for the token in localstorage
  // and send that token to the server to see if it is a real user or hasn't expired
  // if it's not valid, we then redirect back to signin/signup
  $rootScope.$on('$routeChangeStart', function (evt, next) {
    if (next.$$route && next.$$route.authenticate && !Auth.isAuth()) {
      $location.path('/login');
    }
  });
}]);

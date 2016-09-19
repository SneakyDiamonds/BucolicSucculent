angular.module('app.services', ['ngGeolocation', 'btford.socket-io'])

.factory('Requests', ['$http', '$window', function($http, $window) {
  return {
    getGameData: function(path) {
      var params = {
        //setItem and getItem 
        username: $window.localStorage.getItem('user'), 
        path: path
      };
      var token = $window.localStorage.getItem('token');
      $http.defaults.headers.common['x-access-token'] = token;
      return $http({
        method: 'GET',
        url: '/api/game',  
        params: params
      });
    },
    getGameStats: function(path) {
      var params = {
        path: path
      };
      var token = $window.localStorage.getItem('token');
      $http.defaults.headers.common['x-access-token'] = token;
      return $http({
        method: 'GET',
        url: '/api/game',  
        params: params
      });
    },
    createPrivateGame: function(user, markers) {
      var data = {
        username: user,
        markers: markers,
      };
      var token = $window.localStorage.getItem('token');
      $http.defaults.headers.common['x-access-token'] = token;
      return $http({
        method: 'POST',
        url: '/api/game',
        data: data
      });
    },

    createPublicGame: function(user, markers) {
      var data = {
        username: user,
        markers: markers, 
      };
      var token = $window.localStorage.getItem('token');
      $http.defaults.headers.common['x-access-token'] = token;
      return $http({
        method: 'POST',
        url: '/api/public',
        data: data
      });
    },

    getPublicGamesUserData: function() {
      console.log('i hit getPublicGamesUserData');

      return $http({
        method: 'GET',
        url: '/api/publicgameuserdata',

      });

    },

    updateLocStatus: function(user, loc) {
      var data = {
        username: user,
        locationId: loc
      };
      var token = $window.localStorage.getItem('token');
      $http.defaults.headers.common['x-access-token'] = token;
      return $http({
        method: 'PUT',
        url: '/api/game',
        data: data
      });
    },
    getUserData: function() {
      var params = {
        username: $window.localStorage.getItem('user')
      };
      var token = $window.localStorage.getItem('token');
      $http.defaults.headers.common['x-access-token'] = token;
      return $http({
        method: 'GET',
        url: '/api/game',
        params: params
      });
    },
    getPublicGames: function() {
      console.log('i hit getPublicGames');
      return $http({
        method: 'GET',
        url: '/api/public',

      });
    },
    updateFacebookData: function() {
      console.log('updateFacebookData');
      var params = {
        username: $window.localStorage.getItem('user')
      }
      var token = $window.localStorage.getItem('token');
      $http.defaults.headers.common['x-access-token'] = token;
      return $http({
        method:'GET',
        url: '/user/facebook',
        params: params
      });
      // .then(function(data){
      //   console.log(data);
      // })
    }
  };
}])
// new factory to provide socket connects
// .factory('socket', ['btford.socket-io'], function(socketFactory){
//   return socketFactory({
//     prefix: 'foo~',
//     ioSocket: io.connect('/bar')
//   });
// })
.factory('socket', function (socketFactory) {
    return socketFactory();
})
.factory('socket2', function ($rootScope) {
  return {
    on: function (eventName, callback) {
      socket.on(eventName, function () {  
        var args = arguments;
        $rootScope.$apply(function () {
          callback.apply(socket, args);
        });
      });
    },
    emit: function (eventName, data, callback) {
      socket.emit(eventName, data, function () {
        var args = arguments;
        $rootScope.$apply(function () {
          if (callback) {
            callback.apply(socket, args);
          }
        });
      })
    }
  };
})
.factory('Auth', ['$http', '$location', '$window', function ($http, $location, $window) {
  // Auth service is responsible for authenticating our user
  // by exchanging the user's username and password
  // for a JWT from the server
  // that JWT is then stored in localStorage as 'token'
  // after you login/signup open devtools, click resources,
  // then localStorage and you'll see your token from the server
  var login = function (user) {
    return $http({
      method: 'POST',
      url: '/api/users/login',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'username': user.username,
        'password': user.password
      }
    })
    .then(function (resp) {
      console.log(resp, 'does response now have fb info?');
      $window.localStorage.setItem('user', resp.data.user);
      return resp.data.token;
    });
  };
  
  var signup = function (user) {
    return $http({
      method: 'POST',
      url: '/api/users/signup',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'username': user.username,
        'password': user.password
      }
    })
    .then(function (resp) {
      $window.localStorage.setItem('user', resp.data.user);
      return resp.data.token;
    });
  };

  var isAuth = function () {
    return !!$window.localStorage.getItem('token');
  };

  var signout = function () {
    $window.localStorage.removeItem('token');
    $location.path('/login');
  };


  return {
    login: login,
    signup: signup,
    isAuth: isAuth,
    signout: signout
  };
}])
.factory('gameFactory', function(){
  return {
    makePlayerObject: function(user, lat, lng, avatar, content){
      return {
        user: user,
        window: {
          options: { content: content},
          show: false
        },
        longitude: lat,
        latitude: lng,
        radius: 100,
        stroke: {
              color: color || 'red',
              weight: 1,
              opacity: 0.4
            },
        fill: {
          color: color || 'red',
          opacity: 0.3
        }
      }
    }
  }
})
.factory('Map', ['$rootScope', '$http', '$q', function($rootScope, $http, $q) {
  var initialize = function() {
    var defaultLocation = {
      lat: 37.783697,
      lng: -122.408966
    };
    return $http.get('styles/map/styles.json').then(function(styles) {
      return new google.maps.Map(document.getElementById('map'), {
        center: $rootScope.userLocation || defaultLocation,
        zoom: 15,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        styles: styles.data,
        zoomControl: true,
        zoomControlOptions: {
          position: google.maps.ControlPosition.RIGHT_BOTTOM
        },
        mapTypeControl: false,
        scaleControl: false,
        streetViewControl: false,
        rotateControl: false,
        fullscreenControl: false
      });
    });
  };

  var getCenter = function(map) {
    return {
      lat: map.getCenter().lat(),
      lng: map.getCenter().lng()
    }
  };

  // initializeMarkerLayer collects any markers that aren't in a layer 
  // (so all of them) and puts them in a manipulatable DOM pane
  // https://www.sitepoint.com/animated-google-map-markers-css-javascript
  var initializeMarkerLayer = function(map) {
    var myoverlay = new google.maps.OverlayView();
    myoverlay.draw = function() {
      this.getPanes().markerLayer.id = 'markerLayer';
    };
    myoverlay.setMap(map);
  }

  var _createMarker = function(place, title, map) {
    var icon = {
      url: 'images/marker/marker-lavender-36x36@2x.png',
      size: new google.maps.Size(36, 36),
      scaledSize: new google.maps.Size(36, 36),
      origin: new google.maps.Point(0,0)
    };
    var marker = new google.maps.Marker({
      position: place.location,
      icon: icon,
      title: title,
      map: map,
      optimized: false
    });
    return marker;
  }

  var createDestination = function(place, title, map) {
    return _createMarker(place, title, map);
    // marker.setMap(map);
    // return marker;
  }

  // Find nearby places using Google API based on location
  // https://developers.google.com/maps/documentation/javascript/places#place_search_requests
  var findNearbyPlaces = function(map) {
    var request = {
      location: getCenter(map),
      radius: '5000', // meters
      types: ['establishment']
    };
    service = new google.maps.places.PlacesService(map);

    return $q(function(resolve, reject) {
      service.nearbySearch(request, function(results, status) {
        if (status == google.maps.places.PlacesServiceStatus.OK) {
          var places = [];
          for (var i = 0; i < results.length; i++) {
            // Show only up to 6 images at one time
            // if (places.length >= 6) { break; }
            (function(i) {
              var place = {
                name: results[i].name,
                photo: typeof results[i].photos !== 'undefined' ? results[i].photos[0].getUrl({'maxWidth': 200, 'maxHeight': 140}) : '',
                location: {
                  lat: results[i].geometry.location.lat(),
                  lng: results[i].geometry.location.lng()
                },
                rating: results[i].rating,
              };
              if (place.photo) {
                places.push(place);
              }
            })(i);
          }
          resolve(places);
        }
        resolve('Error with Google Places Services');
      });
    })
  }

  return {
    initialize: initialize,
    getCenter: getCenter,
    initializeMarkerLayer: initializeMarkerLayer,
    createDestination: createDestination,
    findNearbyPlaces: findNearbyPlaces,
  }
}]);
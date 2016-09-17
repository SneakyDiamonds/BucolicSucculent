angular.module('app.game', ['uiGmapgoogle-maps', 'app.services', 'ngGeolocation'])

.controller('gameController', ['$scope', '$window', 'isAuth', '$location', function($scope, $window, isAuth, $location) {
  //Check for JWT
  if (!isAuth) {
    var redir = $location.$$path;
    $window.localStorage.setItem('redir', redir);
    $location.path('/login');
  }


}])
.controller('gameMapController', ['$scope', 'data', 'uiGmapGoogleMapApi', '$geolocation', 'Requests', '$window', 'socket','gameFactory', function($scope, data, uiGmapGoogleMapApi, $geolocation, Requests, $window, socket, gameFactory) {
  //test socket connection
  socket.on('send:time', function (data) {
      console.log(data);
    });
  //update other player locations
  socket.on('updateLocation', function(data){
      console.log('socket updateLocation', data);
      if($scope.playersPlaying[data.user] === undefined){

        $scope.playersPlaying[data.user] = data;
        $scope.players.push(data);
      } else {

        var playersCount = $scope.players.length;
        for(var i = 0; i < playersCount; i++) {
          if($scope.players[i].user === data.user){
            $scope.players[i] = data;
            return;
          }
        }
      }
    });
  //Get user and markers data
  $scope.user = $window.localStorage.getItem('facebookname') || $window.localStorage.getItem('user');
  $scope.facebookavatar = $window.localStorage.getItem('facebookavatar') || null;
  $scope.markers = data.data;
  $scope.userMarkOptions = {
    options: {
      icon: $scope.facebookavatar
    }
  }
  //Identify new playersPlaying or update playersLocation in players
  $scope.playersPlaying = {};
  $scope.players = []; 


  // $scope.players = res.data.players; //<----------------- wishlist

  //Add labels to markers according to sequence number
  $scope.markers.forEach(function(marker, ind) {
    var label = marker.sequence.toString();
    $scope.markers[ind].options = {
      label: label
    };
  });

  $scope.position= {
    latitude: 37.7836881,
    longitude: -122.40904010000001
  }
  // $watch will rebind new location position to map center when user location changes
  // in '$geolocation.position.changed' $on listener below
  $scope.$watch('position', function(newloc){
    $scope.map.center = newloc;
  });

  $scope.$watch('players', function(updatedPlayersArray){
    $scope.players = updatedPlayersArray;
  }, true);

  // $scope.$watch('player2', function(newPlayer2){
  //   console.log(typeof newPlayer2, newPlayer2, 'newPlayer2')
  //   $scope.player2 = newPlayer2;
  // });
  //necessary to watch players object? --- check later
  $scope.$watch('playersPlaying', function(updatePlayersPlaying){
    $scope.playersPlaying = updatePlayersPlaying;
  }, true)


  $scope.map = { 
    center: $scope.position, 
    zoom: 13,
    events: {                               //<--------- add click event to google map
      click: function(mapModel, eventName, originalEventArgs) {
     }
    }
  };
  //init map
  uiGmapGoogleMapApi.then(function(maps) {
    // post rendering tasks....
    // console.log(map);
  });

  //create position on map
  var createMyPosition = function() {

    $geolocation.watchPosition(function(success){

    }, null, {
      timeout: 3000,
      maximumAge: 250,
      enableHighAccuracy: true
    });
  };

  createMyPosition();

  //watch for position change
  $scope.$on('$geolocation.position.changed', function() {
    var lat = $geolocation.position.coords.latitude;
    var lng = $geolocation.position.coords.longitude;

    var pos = {
        latitude: lat,
        longitude: lng
      };
    //update $scope.position so $scope.$watch('position') can re-register new location for map to render!  
    $scope.position = pos; 
    //emit changed position to broadcast from serverside to all users 
    //broadcast color as red so user knows what color to render you on their map!
    socket.emit('updateLocation', {
      //in order for ui-gmap-markers within view to render correctly, keep the object formatting below
      // user:$scope.user, <== bring this back later for ui markers
      // latitude: lat,
      // longitude: lng
      gameId: data.gameId,
      id: 1,
      options: {
        label: 1
        },
      user: $scope.user, 
      latitude: lat, 
      longitude: lng,
      radius: 100,
      stroke: {
        color: 'red',
        weight: 1,
        opacity: 0.4
      },
      fill: {
        color: 'red',
        opacity: 0.3
      }
    }); 
    // my location
    $scope.circle = {
      center: pos,
      radius: 100,
      stroke: {
        color: 'red',
        weight: 1,
        opacity: 0.4
      },
      clickable: true,
      events: {
        click: function() {

        },
        mouseover: function() {

        }
      },
      fill: {
        color: 'red',
        opacity: 0.3
      }
    };




      // create gmap latLng object for calculating distance
    $scope.myLatLng = new google.maps.LatLng($geolocation.position.coords.latitude, $geolocation.position.coords.longitude);  
  });

  //window for marker
  $scope.wind = {
    options: {
      content: '<div id= "bulba"><img src= \'http://pldh.net/media/pokemon/shuffle/001.png\'/></div>'
    },
    show: false
  };

  //the actual user marker
  $scope.mark = {

    events: {
      click: function() {
        $scope.wind.show = !$scope.wind.show;
      },
      // mouseover: function() {
      //   console.log('hitting my mouseover event');
      //   $scope.wind.show = true;
      // },
      // mouseout: function() {
      //   console.log('hitting my mouseOUT event yo!');
      //   $scope.wind.show = false;
      // }

    },

    options: {
      icon:'http://pldh.net/media/pokemon/gen3/frlg/007.png',
      title: 'squirtle!!!!'
    }
  };



  $scope.validateLocation = function(locationId) { 

    if ($scope.myLatLng) {
      $scope.locationError = false;
      // console.log('checking location: ', locationId);
      var pointToCheck;
      $scope.markers.forEach(function(location) {
        if (location.id === locationId) { // get specific marker data
          pointToCheck = new google.maps.LatLng(location.latitude, location.longitude);

          var distanceBetween = google.maps.geometry.spherical.computeDistanceBetween($scope.myLatLng, pointToCheck);

          if (distanceBetween <= 100) { //<---------- ok within 100 meters

            // make call to server to update location status for player
            Requests.updateLocStatus($scope.user, locationId).then(function() {    
              // adjust local location data
              location.statuses.status = true;
              $scope.verifyFailed = false;
            }); 
          } else {
            // location not close enough... display notification
            $scope.verifyFailed = true;     
          }
        }
      });
    } else {
      createMyPosition();
      $scope.locationError = true;
    }
  };
}])
.controller('gameStatsController', ['$scope', 'data', function($scope, data) {
  $scope.players = data.data;
}])
.controller('publicController', ['$scope', 'data', 'popular', '$location', '$window', function($scope, data, popular, $location, $window) {

  $scope.list = function() {
    console.log('what is popular????', popular);
  };

  $scope.games = popular;

  $scope.goToGame = function(path) {
    $location.path('/game/' + path + '/map');
  };

}]);


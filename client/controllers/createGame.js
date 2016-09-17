angular.module('app.createGame', ['uiGmapgoogle-maps', 'app.services', 'app'])

.controller('createGameController', ['Map', '$scope', 'uiGmapGoogleMapApi', 'Requests', '$rootScope', '$window', 'isAuth', '$location', '$compile', function(Map, $scope, uiGmapGoogleMapApi, Requests, $rootScope, $window, isAuth, $location, $compile) {

  //check for JWT
  if (!isAuth) {
    $location.path('/login');
  }

  $scope.showMap = true;

  $scope.markers = [];
  $scope.destinations = [];

  Map.initialize().then(function(map) {
    $scope.map = map;
    Map.initializeMarkerLayer($scope.map);
    // $scope.center = Map.getCenter($scope.map);
    // $scope.map.setCenter({
    //   lat: e.latLng.lat() + 0.00075,
    //   lng: e.latLng.lng()
    // });
    // $scope.map.setZoom(18);
    Map.findNearbyPlaces($scope.map).then(function(places) {
      // for (var i = 0; i < places.length; i++) {
      for (var i = 0; i < places.length; i++) {
        var place = places[i];
        console.log($scope.markers.length, place);
        var marker = Map.createDestination(place, $scope.markers.length.toString(), $scope.map)
        marker = $scope._customizeDestination(place, marker, map, $scope);
        marker = $scope._addHoverEffect(marker, map);
        $scope.markers.push(marker);
      }
    });
  });

  // Call when game is to be created
  $scope.createPrivateGame = function() {

    // Get user for ajax request
    $scope.user = $window.localStorage.getItem('user');

    // Get waypoints from map and submit to server to create createGame
    Requests.createPrivateGame($scope.user, $scope.destinations)
      .then(function(res) {
        // Get back hashed game url and refresh display
        $scope.gamePath = res.data;
      });

    // Hide map on game creation
    $scope.showMap = false;
  };

  $scope.createPublicGame = function() {

    // Get user for ajax request
    $scope.user = $window.localStorage.getItem('user');

    // Get waypoints from map and submit to server to create createGame
    Requests.createPublicGame($scope.user, $scope.destinations) 
      .then(function(res) {
        // Get back hashed game url and display
        $scope.gamePath = res.data;
      });

    // Hide map on game creation
    $scope.showMap = false;
  };


  $scope._addHoverEffect = function(marker, map) {
    google.maps.event.addListener(marker, 'mouseover', function() {
      marker.infowindow.open(map, marker);
    })
    google.maps.event.addListener(marker, 'mouseout', function() {
      setTimeout(function() {
        marker.infowindow.close();
      }, 1500);
    })
    return marker;
  }

  $scope.addDestination = function(place) {
    console.log('Adding destination');
    console.log(place);
    $scope.destinations.push(place);
    $scope.$apply();
    console.log($scope.destinations);
  }

  $scope._customizeDestination = function(place, marker, map, $scope) {
    // var title = Number(marker.title);
    // setTimeout(function() {

      var infowindowContent = '<div class="iw">\
        <div class="iw-title">' + place.name + '</div>\
        <img class="iw-photo" src="' + place.photo + '"/><br/>\
      <div>';

      var infowindow = new google.maps.InfoWindow({
        content: infowindowContent,
        disableAutoPan: true, // prevent map from moving around to each infowindow - spastic motion
        maxWidth: 200 // width of the card - also change .gm-style-iw width in css
      });

      marker.addListener('click', function(e) {
        $scope.addDestination(place);
      });

      // assign iw to marker
      marker.infowindow = infowindow;

      // keep infowindow closed
      infowindow.close();

      // Add custom styling to the Google infowindow to differentiate our app
      google.maps.event.addListener(infowindow, 'domready', function() {

        // This is the <div> which receives the infowindow contents
        var iwOuter = $('.gm-style-iw');

        // The <div> we want to change is above the .gm-style-iw <div>
        var iwBackground = iwOuter.prev();

        // Remove the background shadow <div>
        iwBackground.children(':nth-child(2)').css({'display' : 'none'});

        // Remove the white background <div>
        iwBackground.children(':nth-child(4)').css({'display' : 'none'});

        // Move the infowindow to the right.
        // iwOuter.parent().parent().css({left: '25px'});

        // Move the shadow of the arrow 76px to the left margin 
        // iwBackground.children(':nth-child(1)').attr('style', function(i,s){ return s + 'left: -25px !important;'});
        iwBackground.children(':nth-child(1)').css({'display': 'none'});

        // Move the arrow 76px to the left margin 
        // iwBackground.children(':nth-child(3)').attr('style', function(i,s){ return s + 'left: -25px !important;'});

        // Change color of tail outline
        // The outline of the tail is composed of two descendants of <div> which contains the tail
        // The .find('div').children() method refers to all the <div> which are direct descendants of the previous <div>
        iwBackground.children(':nth-child(3)').find('div').children().css({'display': 'none'});
        // iwBackground.children(':nth-child(3)').find('div').children().css({'box-shadow': 'rgba(140, 140, 140, 0.6) 0px 1px 6px', 'z-index' : '1'});
        // iwBackground.children(':nth-child(3)').find('div').children().css({
        //   'box-shadow': 'none !important',
        //   'background': 'none !important',
        //   'z-index' : '1'
        // });

        // This <div> groups the close button elements
        var iwCloseBtn = iwOuter.next();

        // Remove close button
        iwCloseBtn.css({'display': 'none'});

      });

      // $('#markerLayer > div').eq(title + 1).prepend($('<div>', {class: 'lavender ring'}));
      // $('#markerLayer > div').eq(title + 1).prepend($('<div>', {class: 'shadow'}));
      // $('#markerLayer > div').eq(title + 1).prepend(infowindow);
    // }, 500);
    return marker;
  }
}]);
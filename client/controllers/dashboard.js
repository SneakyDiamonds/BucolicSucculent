angular.module('app.dashboard', [])

.controller('dashboardController', ['$scope', 'data', 'isAuth', '$location', '$window', 'Requests', function($scope, data, isAuth, $location, $window, Requests) {
  if (!isAuth) {
    var redir = $location.$$path;
    $window.localStorage.setItem('redir', redir);
    $location.path('/login');
  }
  $window.localStorage.setItem('facebookname', data.userFacebook.facebookname || undefined);
  $window.localStorage.setItem('facebookavatar', data.userFacebook.facebookavatar || undefined);

  $scope.user = data.userFacebook.facebookname || data.userdata.username;
  $scope.games = data.userdata.games;
  $scope.userAvatar = data.userFacebook.facebookavatar
  //update facebook stuffs
  $scope.facebook = Requests.updateFacebookData;

  $scope.goToGame = function(path) {
    $location.path('/game/' + path + '/map');
  };
}]);

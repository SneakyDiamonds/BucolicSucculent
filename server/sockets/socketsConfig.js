var gameRooms = {}; //<=== server temp storage for game room data

module.exports = function (socket) {

  socket.on('updateLocation', function(data){ //=== data needs to contain 3 things.. game url, socket, name
    var user = data.user
    console.log(user);
    if(!gameRooms[data.gameId]){
      gameRooms[data.gameId] = {};
      gameRooms[data.gameId][user] = socket;
    } else {
      gameRooms[data.gameId][user] = socket;

    }
    for(var key in gameRooms[data.gameId]){
      gameRooms[data.gameId][key].emit('updateLocation', data);
    }
  })

  setInterval(function () { //<=== keep this running to make sure sockets is working on client side
    socket.emit('send:time', {
      time: (new Date()).toString()
    });
  }, 10000);
};
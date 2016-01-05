var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var _ = require('lodash');


var users = [];

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});

app.use(express.static(__dirname + '/assets'));

io.on('connection', function(socket) {

  socket.join('general_room');
  io.to(socket.id).emit('userObj_request', socket.id);

  socket.on('disconnect', function() {
    console.log('user disconnected');
    users = _.remove(users, function(userObj) {
      return userObj.id != socket.id;
    });
    io.to('general_room').emit('general_room_users', users);
  });

  socket.on('userObj_request_response', function(userObj) {
    users.push(userObj);
    _.forEach(users, function(user) {
      if (userObj.id != user.id) {
        io.to(user.id).emit('connected', 'A new user connected');
      }
    });
    io.to('general_room').emit('general_room_users', users);
  });


  socket.on('user_typing', function(user) {
    io.to('general_room').emit('user_types', user);
  });

  socket.on('user_stopped_typing', function(user) {
    io.to('general_room').emit('user_not_typing', user);
  });

  socket.on('chat message', function(msg) {
    var sender = _.find(users, function(user) {
      return user.id == socket.id;
    });

    var data = {
      'sender': sender,
      'msg': msg
    };

    _.forEach(users, function(user) {
      if (socket.id != user.id) {
        io.to(user.id).emit('chat message', data);
      }
    });
  });

  socket.on('start_private_chat', function(privateChat) {
    console.log("recieved private chat session");
    io.to(privateChat.reciever.id).emit('private_message', privateChat);
  });
});


http.listen(3000, function() {
  console.log('listening on *:3000');
});

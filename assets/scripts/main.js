var username = '';
var socket = '';
var user = {};
var userLists = {};

$('#login').on('click', function() {
  username = $('#username').val();
  if (username) {
    $('.login').css('display', 'none');
    $('#chat').css('display', 'block');
    activateSocket();
    user.userName = username;
  }
});

function activateSocket() {
  socket = io();

  socket.on('chat message', function(msg) {
    $('#circleG' + msg.sender.id).css('display', 'none');
    $('#messages').append($('<li>').text(msg.sender.userName + ": " + msg.msg));
  });

  socket.on('userObj_request', function(id) {
    user.id = id;
    socket.emit('userObj_request_response', user);
  });

  socket.on('connected', function(msg) {
    $('#messages').append($('<li class="new_user">').text(msg));
  });

  socket.on('general_room_users', function(userList) {
    userLists.general_room = userList;
    updateUserList();
  });

  socket.on('user_types', function(user) {
    $('#circleG' + user.id).css('display', 'inline-block');
  });
  socket.on('user_not_typing', function(user) {
    $('#circleG' + user.id).css('display', 'none');
  });
  socket.on('private_message', function(chatObj) {
    console.log("recieved private message");
    createPrivateChat(chatObj.sender);
  });
}

function updateUserList() {
  $('#userList').empty();
  _.forEach(userLists.general_room, function(user) {
    var element = $('<li data-user-id="' + user.id + '" data-user-name="' + user.userName + '">' + user.userName + '<div id="circleG' + user.id + '" class="type_animation"><div id="circleG_1" class="circleG"></div><div id="circleG_2" class="circleG"></div><div id="circleG_3" class="circleG"></div></div></li>');
    $('#userList').append(element);
    $(element).bind('click', function(e) {
      if ($('#' + user.id + user.userName).length === 0) {
        createPrivateChat(user);
      }
    });
  });
}


function createPrivateChat(clickedUser) {
  var dataObject = {
    id: clickedUser.id + 'privateChat',
    chatPerson: clickedUser
  };


  var chatWindow = $('<div id="' + clickedUser.id + clickedUser.userName + '" class="modal"></div>');
  chatWindow.html(tmpl("item_tmpl", dataObject));
  //pmtLZuSS3CWqPizb1EAAAS

  $("#modalContainer").append(chatWindow);
  $('.close').bind('click', function() {
    chatWindow.remove();
  });

  $('#' + clickedUser.id + 'privateChat' + ' form').submit(function() {
    var privateMsg = $('#pm' + clickedUser.id).val();
    var privateChat = {
      sender: user,
      reciever: clickedUser,
      msg: privateMsg
    };
    socket.emit('start_private_chat', privateChat);
    if ($('#m').val() !== '') {
      $('#messages').append($('<li class="user_own_text">').text(user.userName + ": " + $('#m').val()));
      socket.emit('chat message', $('#m').val());
    }
    $('#m').val("");
    socket.emit('user_stopped_typing', user);
    return false;
  });

  $('#' + clickedUser.id + clickedUser.userName).draggable();

}


$("#m").keyup(function(e) {
  console.log(e);
  if ((e.keyCode === 8 || e.keyCode === 13) && $(e.target).val() === '') {
    socket.emit('user_stopped_typing', user);
  } else {
    socket.emit('user_typing', user);
  }
});
$('#chat form').submit(function() {
  if ($('#m').val() !== '') {
    $('#messages').append($('<li class="user_own_text">').text(user.userName + ": " + $('#m').val()));
    socket.emit('chat message', $('#m').val());
  }
  $('#m').val("");
  socket.emit('user_stopped_typing', user);

  return false;
});

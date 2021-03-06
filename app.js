"use strict";

var gameport = process.env.PORT || 8080;
var io = require('socket.io');
var express = require('express');
var UUID = require('node-uuid');
var http = require('http');
var app = express();
var server = http.createServer(app);

server.listen(gameport, "localhost", function () {
    console.log(':: Server :: Listening on port ' + gameport);
});

app.use(express.static('./'));

//Allow accessing to homepage
app.get('/', function (req, res) {
    console.log('Loading the homepage /index.html');
    res.sendFile('/index.html', {
        root: __dirname
    });
});

//Expose all assets and urls under conndectFour/
app.get('/*', function (req, res, next) {
    var file = req.params[0];
    res.sendFile(__dirname + '/' + file);
});

//Setup sockets to listen on port
var sio = io.listen(server);

//Set up gameServer model instance
var gameServer = require("./js/gameServer.js");

//Listen for connections via socket.io
sio.on('connection', function (client) {

    //assign UUID to user
    client.userID = UUID();

    //Send user their UUID on connection
    client.emit('onconnection', {
        id: client.userID
    });

    console.log(':: Socket.io :: player ' + client.userID + ' connected');

    gameServer.findGame(client);

    //Listen for game moves
    client.on('playerMove', function (data) {
        gameServer.playerMove(client.userID, data);
    });

    //Ensure both users disconnect when one disconnects
    client.on('disconnect', function () {

        //Useful to know when soomeone disconnects
        console.log(':: Socket.io :: client disconnected ' + client.userID + ' ' + client.game_id);

        //Disconnect users
        if (client.game && client.game.id) {
            gameServer.endGame(client.game.id, client.userID);
        }
    });
});

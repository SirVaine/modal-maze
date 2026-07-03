const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

app.use(express.static(path.join(__dirname, 'public')));
let rooms = {};

io.on('connection', (socket) => {
    socket.on('createRoom', () => {
        const pin = Math.floor(1000 + Math.random() * 9000).toString();
        rooms[pin] = { hostId: socket.id, players: {} };
        socket.join(pin);
        socket.emit('roomCreated', pin);
    });

    socket.on('joinRoom', (data) => {
        if (rooms[data.pin]) {
            rooms[data.pin].players[socket.id] = { name: data.name, position: 1, missTurn: false };
            socket.join(data.pin);
            socket.emit('joinSuccess', data.pin);
            io.to(rooms[data.pin].hostId).emit('updateLobby', rooms[data.pin].players);
        } else {
            socket.emit('joinError', 'Room not found!');
        }
    });

    socket.on('startGame', (data) => {
        io.to(data.pin).emit('gameStarted');
    });

    socket.on('setPlayerState', (data) => {
        io.to(data.playerId).emit('changeState', data.state);
    });

    socket.on('rollDice', (data) => {
        let result = Math.floor(Math.random() * 7) + 1;
        if(rooms[data.pin]) {
            io.to(rooms[data.pin].hostId).emit('diceResultHost', { playerId: socket.id, result: result });
        }
    });

    socket.on('submitAnswer', (data) => {
        if(rooms[data.pin]) {
            io.to(rooms[data.pin].hostId).emit('answerReceivedHost', { playerId: socket.id, answer: data.answer });
        }
    });
});

http.listen(3000, () => console.log('Server running on http://localhost:3000'));
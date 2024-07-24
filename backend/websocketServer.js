const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: 'http://localhost:5173', 
        methods: ["GET", "POST"],
        allowedHeaders: ["Authorization", "Content-Type"],
        credentials: true
    }
});

io.on('connection', (socket) => {


    socket.on('message', (message) => {

    });

    socket.on('disconnect', () => {

    });
});

const sendNotification = (notification) => {
    io.emit('notification', notification); // Emit notification to all connected clients
};

module.exports = { sendNotification };

const wsPort = process.env.WEB_SOCKET_PORT || 4500;
server.listen(wsPort, () => {

});

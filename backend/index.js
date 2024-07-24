const express = require("express");
const bodyParser = require("body-parser");
const cors = require('cors');
const userRoutes = require("./routes/user-route");
const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: 'http://localhost:5173', // Your frontend URL
        methods: ["GET", "POST"],
        allowedHeaders: ["Authorization", "Content-Type"],
        credentials: true
    }
});

const port = process.env.PORT || 3001;

// Configure CORS
const corsOptions = {
    origin: 'http://localhost:5173',
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    preflightContinue: false,
    optionsSuccessStatus: 204
};
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use("/user", userRoutes);
app.use('/api', userRoutes);
app.use(cors());
app.use(express.json());

// Socket.io setup
io.on('connection', (socket) => {


    socket.on('message', (message) => {

    });

    socket.on('disconnect', () => {

    });
});

// Function to send notifications
const sendNotification = (notification) => {
    io.emit('notification', notification);
};

module.exports = { sendNotification };

server.listen(port, () => {
    
});

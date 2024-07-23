import { createServer } from 'http';
import { Server } from 'socket.io';

// Create HTTP server
const httpServer = createServer();

// Create a new instance of Socket.IO server
const io = new Server(httpServer, {
    cors: {
        origin: process.env.NODE_ENV === 'production' ? false : ['http://localhost:5500', 'http://127.0.0.1:5500']
    }
});

// Handle incoming connections
io.on('connection', (socket) => {
    console.log(`User ${socket.id.substring(0, 5)} connected`);


    // Handle incoming chat messages
    socket.on('message', (data) => {
        io.emit('message', data);
    });

    // Handle drawing data
    socket.on('drawing', (path) => {
        socket.broadcast.emit('drawing', path);
    });

    // Handle canvas clear
    socket.on('clearCanvas', () => {
        io.emit('clearCanvas');
    });

    // Handle user name
    socket.on('setName', (name) => {
        socket.username = name; // Store the username in the socket object
        io.emit('message', `${name} has joined the chat`);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log(`User ${socket.id.substring(0, 5)} disconnected`);
        if (socket.username) {
            io.emit('message', `${socket.username} has disconnected`);
        }
    });
});

// Start the server
httpServer.listen(3500, () => {
    console.log('Server is listening on port 3500');
});

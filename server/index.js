import { createServer } from 'http';
import { Server } from 'socket.io';

const httpServer = createServer();


const io = new Server(httpServer, {
    cors: {
        origin: process.env.NODE_ENV === 'production' ? false : ['http://localhost:5500', 'http://127.0.0.1:5500']
    }
});

const words = [
    "hat", "smile", "jail", "lizard", "ants", "bridge", "mouse", "sun", "book", "spider",
    "coin", "nose", "rocket", "crayon", "kite", "bow", "fire", "carrot", "apple", "America",
    "compass", "plane", "sock", "penguin", "song", "helicopter", "wizard", "storm", "sugar",
    "snake", "boxing", "taxi", "toothpaste", "time", "voice", "knife", "boat", "spider",
    "boy", "star", "grapes", "whale", "grass", "pencil", "computer", "bird", "tail", "family",
    "egg", "monkey", "bark", "football", "Earth", "feet", "bat", "bug", "heart", "neck",
    "balloon", "lamp", "king", "queen", "frog"
  ];

let users = [];
let currentDrawer = null;
let currentWord = '';
let drawingTimer = null;
let userScores = {};

// Handle incoming connections
io.on('connection', (socket) => {
    console.log(`User ${socket.id.substring(0, 5)} connected`);
    users.push(socket);
    userScores[socket.id] = 0;
    userScores[socket.id] = { score: 0, username: '' }; 
    // Handle incoming chat messages
    socket.on('message', (data) => {
        io.emit('message', data);
    });

    // Handle drawing data
    socket.on('drawing', (data) => {
        if (socket === currentDrawer) {
            socket.broadcast.emit('drawing', data);
        }
    });

    // Handle canvas clear
    socket.on('clearCanvas', () => {
        if (socket === currentDrawer) {
            io.emit('clearCanvas');
        }
    });

    // Handle user name
    socket.on('setName', (name) => {
        socket.username = name;
        userScores[socket.id].username = name;
        io.emit('message', `${name} has joined the chat`);
        
        if (users.length >= 2 && !currentDrawer) {
            startGame();
        }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log(`User ${socket.id.substring(0, 5)} disconnected`);
        users = users.filter(user => user !== socket);
        delete userScores[socket.id];
        if (socket.username) {
            io.emit('message', `${socket.username} has disconnected`);
        }

        if (socket === currentDrawer) {
            clearTimeout(drawingTimer);
            currentDrawer = null;
            currentWord = '';
            io.emit('clearCanvas');
            if (users.length >= 2) {
                startGame();
            }
        }
    });

    // Handle quess
    socket.on('guess', (guess) => {
        if (guess.toLowerCase() === currentWord.toLowerCase()) {
            userScores[socket.id].score += 10;
            io.emit('message', `${socket.username} guessed the word correctly and earned 10 points!`);
            io.to(socket.id).emit('correctGuess', socket.id);

            io.emit('updateScores', userScores);

            clearTimeout(drawingTimer);
            currentDrawer = null;
            currentWord = '';
            io.emit('clearCanvas');
            io.emit('message', 'Time\'s up! The drawing time has ended.');
            if (users.length >= 2) {
                startGame();
            }
        }
    });
});

function startGame() {
    if (users.length < 2) return;

    const randomIndex = Math.floor(Math.random() * users.length);
    currentDrawer = users[randomIndex];
    currentWord = words[Math.floor(Math.random() * words.length)];
    
    io.to(currentDrawer.id).emit('startDrawing', currentWord);
    io.emit('message', `${currentDrawer.username} is drawing...`);

    drawingTimer = setTimeout(() => {
        currentDrawer = null;
        currentWord = '';
        io.emit('clearCanvas');
        io.emit('message', 'Time\'s up! The drawing time has ended.');
        if (users.length >= 2) {
            startGame();
        }
    }, 35000);
}

// Start the server
httpServer.listen(3500, () => {
    console.log('Server is listening on port 3500');
});

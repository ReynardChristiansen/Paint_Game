const canvas = document.getElementById('drawingCanvas');
const ctx = canvas.getContext('2d');
const clearButton = document.getElementById('clearButton');
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const chatActivity = document.getElementById('chatActivity');
const nameModal = document.getElementById('nameModal');
const modalClose = document.getElementById('modalClose');
const nameSubmit = document.getElementById('nameSubmit');
const userNameInput = document.getElementById('userNameInput');

let drawing = false;
let currentPath = [];
let userName = ''; // Store user name

// Connect to Socket.IO server
const socket = io('ws://localhost:3500');

// Open modal on page load
window.onload = () => {
    nameModal.style.display = 'block';
};

// Handle modal close
modalClose.onclick = () => {
    nameModal.style.display = 'none';
};

// Handle name submission
nameSubmit.onclick = () => {
    const name = userNameInput.value.trim();
    if (name) {
        userName = name;
        socket.emit('setName', userName); // Send name to server
        nameModal.style.display = 'none';
    }
};

// Handle chat messages
socket.on('message', (data) => {
    chatActivity.textContent = '';
    const messageElement = document.createElement('div');
    messageElement.textContent = data;
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
});

// Handle typing activity
socket.on('activity', (name) => {
    chatActivity.textContent = `${name} is typing...`;
});

// Handle drawing data
socket.on('drawing', (path) => {
    drawPath(path, false);  // Draw without emitting to avoid recursion
});

// Handle canvas clear
socket.on('clearCanvas', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
});

function startDrawing(event) {
    drawing = true;
    currentPath = [{ x: event.clientX - canvas.offsetLeft, y: event.clientY - canvas.offsetTop }];
}

function stopDrawing() {
    if (drawing) {
        socket.emit('drawing', currentPath);
    }
    drawing = false;
    ctx.beginPath();
}

function draw(event) {
    if (!drawing) return;

    const x = event.clientX - canvas.offsetLeft;
    const y = event.clientY - canvas.offsetTop;
    currentPath.push({ x, y });

    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'black';

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
}

function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    socket.emit('clearCanvas');
}

function sendMessage(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        const message = chatInput.value.trim();
        if (message) {
            socket.emit('message', `${userName}: ${message}`);
            chatInput.value = '';
        }
        chatInput.focus();
    }
}

function drawPath(path, shouldEmit = true) {
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'black';

    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    path.forEach(point => {
        ctx.lineTo(point.x, point.y);
        ctx.stroke();
    });

    if (shouldEmit) {
        socket.emit('drawing', currentPath);
    }
}

// Event Listeners
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
clearButton.addEventListener('click', clearCanvas);
chatInput.addEventListener('keydown', sendMessage);

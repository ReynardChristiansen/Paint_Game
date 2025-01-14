const canvas = document.getElementById("drawingCanvas");
const ctx = canvas.getContext("2d");
const clearButton = document.getElementById("clearButton");
const chatMessages = document.getElementById("chatMessages");
const chatInput = document.getElementById("chatInput");
const chatActivity = document.getElementById("chatActivity");
const nameModal = document.getElementById("nameModal");
const nameSubmit = document.getElementById("nameSubmit");
const userNameInput = document.getElementById("userNameInput");
const notificationModal = document.getElementById("notificationModal");
const notificationTitle = document.getElementById("notificationTitle");
const notificationMessage = document.getElementById("notificationMessage");
const modalCloseNotification = document.getElementById(
  "modalCloseNotification"
);

let drawing = false;
let currentPath = [];
let userName = "";
const colorBlocks = document.querySelectorAll(".color-block");
let selectedColor = "#000000";
let isDrawingAllowed = false;
let socket = null;

// Open modal on page load
window.onload = () => {
  nameModal.style.display = "block";
};

// Handle name submission
nameSubmit.onclick = () => {
  const name = userNameInput.value.trim();
  if (name) {
    userName = name;
    nameModal.style.display = "none";
    connectToSocket();
  }
};

// Function to connect to Socket.IO server
function connectToSocket() {
    socket = io("ws://localhost:3500");
  
    // Set up event listeners for socket
    socket.on("connect", () => {
      socket.emit("setName", userName);
    });
  
    socket.on("message", (data) => {
      chatActivity.textContent = "";
      const messageElement = document.createElement("div");
      messageElement.textContent = data;
      chatMessages.appendChild(messageElement);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    });
  
    socket.on("activity", (name) => {
      chatActivity.textContent = `${name} is typing...`;
    });
  
    socket.on("drawing", (data) => {
      drawPath(data.path, false, data.color);
    });
  
    socket.on("clearCanvas", () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    });
  
    socket.on("startDrawing", (word) => {
      isDrawingAllowed = true;
      chatInput.disabled = true;
      showNotification(`${word}`);
    });
  
    socket.on("endDrawing", () => {
      isDrawingAllowed = false;
      chatInput.disabled = false;
    });
  
    socket.on("correctGuess", (userId) => {
      if (socket.id === userId) {
        showNotification("Congratulations! You guessed correctly!");
      }
    });
  
    socket.on("updateScores", (scores) => {
      console.log("Scores:", scores);
  
      const scoreEntries = Object.entries(scores)
      .sort(([, a], [, b]) => b.score - a.score)
      .map(
        ([userId, { score, username }]) =>
          `<div class="score-entry"><strong>${username}:</strong> ${score} points</div>`
      )
      .join("");
  
      chatMessages.innerHTML += `
                      <div class="score-container">
                          <div class="score-header">
                              Score:
                          </div>
                          <div class="score-list">
                              ${scoreEntries}
                          </div>
                      </div>
                  `;
    });
  }

function startDrawing(event) {
  if (!isDrawingAllowed) return;
  drawing = true;
  currentPath = [
    {
      x: event.clientX - canvas.offsetLeft,
      y: event.clientY - canvas.offsetTop,
    },
  ];
}

function stopDrawing() {
  if (!isDrawingAllowed) return;
  if (drawing) {
    socket.emit("drawing", { path: currentPath, color: selectedColor });
  }
  drawing = false;
  ctx.beginPath();
}

function draw(event) {
  if (!isDrawingAllowed || !drawing) return;

  const x = event.clientX - canvas.offsetLeft;
  const y = event.clientY - canvas.offsetTop;
  currentPath.push({ x, y });

  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  ctx.strokeStyle = selectedColor;

  ctx.lineTo(x, y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y);
}

function clearCanvas() {
  if (!isDrawingAllowed) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  socket.emit("clearCanvas");
}


function sendMessage(event) {
    if (event.key === "Enter" && !chatInput.disabled) {
      event.preventDefault();
      const message = chatInput.value.trim();
      if (message) {
        socket.emit("message", `${userName}: ${message}`);
        socket.emit("guess", message);
        chatInput.value = "";
      }
      chatInput.focus();
    }
  }

function drawPath(path, shouldEmit = true, color = "#000000") {
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  ctx.strokeStyle = color;

  ctx.beginPath();
  ctx.moveTo(path[0].x, path[0].y);
  path.forEach((point) => {
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
  });

  if (shouldEmit) {
    socket.emit("drawing", { path: currentPath, color: selectedColor });
  }
}

function showNotification(message) {
  notificationMessage.textContent = message;
  notificationModal.style.display = "block";
}

modalCloseNotification.onclick = () => {
  notificationModal.style.display = "none";
};

colorBlocks.forEach((block) => {
  block.addEventListener("click", () => {
    colorBlocks.forEach((b) => b.classList.remove("selected"));

    block.classList.add("selected");

    selectedColor = block.style.backgroundColor;
  });
});

canvas.addEventListener("mousedown", startDrawing);
canvas.addEventListener("mousemove", draw);
canvas.addEventListener("mouseup", stopDrawing);
clearButton.addEventListener("click", clearCanvas);
chatInput.addEventListener("keydown", sendMessage);

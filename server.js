const express = require("express");
const app = express();

const path = require("path");

const http = require("http");
const { Server } = require("socket.io");

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(express.static(path.resolve("")));

server.listen(3000, () => {
  console.log("port connected to 3000");
});

let arr = [];
let playersArray = [];

let board = Array(9).fill(null);
let currentTurn = "X";

const checkWinner = (board) => {
  const winningCombinations = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [2, 4, 6] // Diagonals
  ];

  for (let combination of winningCombinations) {
    const [a, b, c] = combination;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a]; // Return "X" or "O"
    }
  }
  return board.includes(null) ? null : "Draw"; // Return "Draw" if no empty cells
};

io.on("connection", (socket) => {
  socket.on("playerData", (e) => {
    if (e.name) {
      arr.push(e.name);

      if (arr.length >= 2) {
        let p1obj = {
          p1name: arr[0],
          p1value: "X",
          p1move: ""
        };

        let p2obj = {
          p2name: arr[1],
          p2value: "O",
          p2move: ""
        };

        let obj = {
          p1: p1obj,
          p2: p2obj
        };

        playersArray.push(obj);
        arr.splice(0, 2); // delete the starting 2 elements starting with 0 index
        io.emit("playersData", { allPlayers: playersArray }); // sending the data
      }
    }
  });

  socket.on("restart", () => {
    board = Array(9).fill(null);
    currentTurn = "X";
    io.emit("gameState", { board, currentTurn, reset: true });
  });

  socket.emit("gameState", { board, currentTurn });

  socket.on("playerMove", ({ index, symbol }) => {
    if (board[index] == null && symbol === currentTurn) {
      board[index] = symbol;
      currentTurn = currentTurn === "X" ? "O" : "X";

      const winner = checkWinner(board);
      if (winner) {
        io.emit("gameState", { board, currentTurn });
        io.emit("gameOver", { winner });
      } else {
        io.emit("gameState", { board, currentTurn });
      }
    }
  });
});



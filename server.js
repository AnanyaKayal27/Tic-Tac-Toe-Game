const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

const rooms = {};

function checkWinner(board) {
  const wins = [
    [0,1,2],
    [3,4,5],
    [6,7,8],
    [0,3,6],
    [1,4,7],
    [2,5,8],
    [0,4,8],
    [2,4,6]
  ];

  for (let combo of wins) {
    const [a,b,c] = combo;

    if (
      board[a] &&
      board[a] === board[b] &&
      board[a] === board[c]
    ) {
      return board[a];
    }
  }

  return null;
}

io.on("connection", (socket) => {

  socket.on("createRoom", ({username}) => {

    const roomId =
      Math.random()
      .toString(36)
      .substring(2,7)
      .toUpperCase();

    rooms[roomId] = {
      players: [
        {
          id: socket.id,
          username,
          symbol: "X"
        }
      ],
      board: Array(9).fill(""),
      turn: "X"
    };

    socket.join(roomId);

    socket.emit("roomCreated", {
      roomId,
      symbol: "X"
    });

    io.to(roomId).emit(
      "updatePlayers",
      rooms[roomId].players
    );
  });

  socket.on("joinRoom", ({roomId, username}) => {

    const room = rooms[roomId];

    if (!room) {
      socket.emit("errorMsg", "Room not found");
      return;
    }

    if (room.players.length >= 2) {
      socket.emit("errorMsg", "Room full");
      return;
    }

    room.players.push({
      id: socket.id,
      username,
      symbol: "O"
    });

    socket.join(roomId);

    socket.emit("joinedRoom", {
      roomId,
      symbol: "O"
    });

    io.to(roomId).emit(
      "updatePlayers",
      room.players
    );

    io.to(roomId).emit(
      "startGame",
      room
    );
  });

  socket.on("makeMove", ({roomId, index}) => {

    const room = rooms[roomId];

    if (!room) return;

    const player =
      room.players.find(
        p => p.id === socket.id
      );

    if (!player) return;

    if (player.symbol !== room.turn) return;

    if (room.board[index] !== "") return;

    room.board[index] = player.symbol;

    const winner =
      checkWinner(room.board);

    if (winner) {

      io.to(roomId).emit(
        "gameOver",
        {
          board: room.board,
          winner
        }
      );

      return;
    }

    const draw =
      room.board.every(cell => cell);

    if (draw) {

      io.to(roomId).emit(
        "gameOver",
        {
          board: room.board,
          winner: null
        }
      );

      return;
    }

    room.turn =
      room.turn === "X"
      ? "O"
      : "X";

    io.to(roomId).emit(
      "boardUpdate",
      {
        board: room.board,
        turn: room.turn
      }
    );
  });

  socket.on("playAgain", (roomId) => {

    const room = rooms[roomId];

    if (!room) return;

    room.board = Array(9).fill("");
    room.turn = "X";

    io.to(roomId).emit(
      "restartGame",
      room
    );
  });

  socket.on("disconnect", () => {

    for (let roomId in rooms) {

      const room = rooms[roomId];

      room.players =
        room.players.filter(
          p => p.id !== socket.id
        );

      io.to(roomId).emit(
        "updatePlayers",
        room.players
      );

      if (room.players.length === 0) {
        delete rooms[roomId];
      }
    }
  });
});

server.listen(3000, () => {
  console.log("\n🎮 Tic Tac Toe Server Started!");
  console.log("🌐 Open in Browser:");
  console.log("👉 http://localhost:3000\n");
});
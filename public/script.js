const socket = io();

let roomId = "";
let mySymbol = "";

const login =
document.getElementById("login");

const gameArea =
document.getElementById("gameArea");

const roomCode =
document.getElementById("roomCode");

const symbol =
document.getElementById("symbol");

const turnText =
document.getElementById("turn");

const playersDiv =
document.getElementById("players");

const result =
document.getElementById("result");

const boardCells =
document.querySelectorAll(".cell");

document
.getElementById("createBtn")
.addEventListener("click", () => {

    const username =
    document.getElementById("username").value;

    socket.emit(
      "createRoom",
      { username }
    );
});

document
.getElementById("joinBtn")
.addEventListener("click", () => {

    const username =
    document.getElementById("username").value;

    roomId =
    document.getElementById("roomInput").value
    .toUpperCase();

    socket.emit(
      "joinRoom",
      {
        roomId,
        username
      }
    );
});

socket.on(
  "roomCreated",
  (data) => {

    roomId = data.roomId;

    mySymbol = data.symbol;

    login.style.display="none";
    gameArea.style.display="block";

    roomCode.innerText =
    "Room: " + roomId;

    symbol.innerText =
    "You are " + mySymbol;
});

socket.on(
  "joinedRoom",
  (data) => {

    roomId = data.roomId;

    mySymbol = data.symbol;

    login.style.display="none";
    gameArea.style.display="block";

    roomCode.innerText =
    "Room: " + roomId;

    symbol.innerText =
    "You are " + mySymbol;
});

socket.on(
  "updatePlayers",
  (players) => {

    playersDiv.innerHTML =
    players
    .map(
      p =>
      `${p.username} (${p.symbol})`
    )
    .join("<br>");
});

socket.on(
  "startGame",
  (game) => {

    turnText.innerText =
    "Turn: " + game.turn;
});

boardCells.forEach(cell => {

    cell.addEventListener(
      "click",
      () => {

        socket.emit(
          "makeMove",
          {
            roomId,
            index:
            cell.dataset.index
          }
        );
      }
    );
});

socket.on(
  "boardUpdate",
  (data) => {

    data.board.forEach(
      (value,index) => {

        boardCells[index].innerText =
        value;
      }
    );

    turnText.innerText =
    "Turn: " + data.turn;
});

socket.on(
  "gameOver",
  (data) => {

    data.board.forEach(
      (value,index) => {

        boardCells[index].innerText =
        value;
      }
    );

    if(data.winner){
        result.innerText =
        data.winner + " Wins!";
    }
    else{
        result.innerText =
        "Draw!";
    }
});

document
.getElementById("playAgain")
.addEventListener(
  "click",
  () => {

    socket.emit(
      "playAgain",
      roomId
    );
});

socket.on(
  "restartGame",
  () => {

    boardCells.forEach(
      cell =>
      cell.innerText=""
    );

    result.innerText="";

    turnText.innerText=
    "Turn: X";
});

socket.on(
  "errorMsg",
  (msg) => {

    alert(msg);
});
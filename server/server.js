const WebSocket = require('ws');
const http = require('http');
const cors = require('cors');

const server = http.createServer();
//const wss = new WebSocket.Server({ server });



const wss = new WebSocket.Server({ port: 8081});

let gameState = {
  board: Array(5).fill().map(() => Array(5).fill(null)),
  players: { A: [], B: [] },
  currentPlayer: 'A',
};


const characterMoves = {
  P: ['L', 'R', 'F', 'B'],
  H1: ['L', 'R', 'F', 'B'],
  H2: ['FL', 'FR', 'BL', 'BR'],
};


function initializeGame(setupA, setupB) {
  gameState = {
    board: Array(5).fill().map(() => Array(5).fill(null)),
    players: { A: setupA, B: setupB },
    currentPlayer: 'A',
  };

 
  setupA.forEach((piece, index) => {
    gameState.board[0][index] = `A-${piece}`;
  });

  // Place player B's pieces
  setupB.forEach((piece, index) => {
    gameState.board[4][index] = `B-${piece}`;
  });
}

function isValidMove(player, piece, move) {
  const [row, col] = findPiecePosition(player, piece);
  if (row === -1 || col === -1) return false;

  const pieceType = piece[0];
  if (!characterMoves[pieceType].includes(move)) return false;

  let newRow = row, newCol = col;
  const steps = pieceType === 'P' ? 1 : 2;

  switch (move) {
    case 'L': newCol -= steps; break;
    case 'R': newCol += steps; break;
    case 'F': newRow += (player === 'A' ? steps : -steps); break;
    case 'B': newRow += (player === 'A' ? -steps : steps); break;
    case 'FL': newRow += (player === 'A' ? steps : -steps); newCol -= steps; break;
    case 'FR': newRow += (player === 'A' ? steps : -steps); newCol += steps; break;
    case 'BL': newRow += (player === 'A' ? -steps : steps); newCol -= steps; break;
    case 'BR': newRow += (player === 'A' ? -steps : steps); newCol += steps; break;
  }

  if (newRow < 0 || newRow >= 5 || newCol < 0 || newCol >= 5) return false;

  if (gameState.board[newRow][newCol] && gameState.board[newRow][newCol][0] === player) return false;

  return true;
}

function findPiecePosition(player, piece) {
  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 5; j++) {
      if (gameState.board[i][j] === `${player}-${piece}`) {
        return [i, j];
      }
    }
  }
  return [-1, -1];
}

function handleMove(player, piece, move) {
  if (!isValidMove(player, piece, move)) {
    return false;
  }

  const [oldRow, oldCol] = findPiecePosition(player, piece);
  let newRow = oldRow, newCol = oldCol;
  const steps = piece[0] === 'P' ? 1 : 2;

  switch (move) {
    case 'L': newCol -= steps; break;
    case 'R': newCol += steps; break;
    case 'F': newRow += (player === 'A' ? steps : -steps); break;
    case 'B': newRow += (player === 'A' ? -steps : steps); break;
    case 'FL': newRow += (player === 'A' ? steps : -steps); newCol -= steps; break;
    case 'FR': newRow += (player === 'A' ? steps : -steps); newCol += steps; break;
    case 'BL': newRow += (player === 'A' ? -steps : steps); newCol -= steps; break;
    case 'BR': newRow += (player === 'A' ? -steps : steps); newCol += steps; break;
  }

  
  if (piece[0] !== 'P') {
    const rowStep = (newRow - oldRow) / steps;
    const colStep = (newCol - oldCol) / steps;
    for (let i = 1; i <= steps; i++) {
      const checkRow = oldRow + i * rowStep;
      const checkCol = oldCol + i * colStep;
      if (gameState.board[checkRow][checkCol] && gameState.board[checkRow][checkCol][0] !== player) {
        gameState.board[checkRow][checkCol] = null;
      }
    }
  }

 
  gameState.board[newRow][newCol] = gameState.board[oldRow][oldCol];
  gameState.board[oldRow][oldCol] = null;

  
  gameState.currentPlayer = gameState.currentPlayer === 'A' ? 'B' : 'A';

  return true;
}

function checkWinCondition() {
  const piecesA = gameState.board.flat().filter(cell => cell && cell[0] === 'A').length;
  const piecesB = gameState.board.flat().filter(cell => cell && cell[0] === 'B').length;

  if (piecesA === 0) return 'B';
  if (piecesB === 0) return 'A';
  return null;
}

function broadcast(message) {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}

wss.on('connection', (ws) => {
  console.log('New client connected');

  
  ws.send(JSON.stringify({ type: 'init', state: gameState }));

  ws.on('message', (message) => {
    const data = JSON.parse(message);

    if (data.type === 'start') {
      initializeGame(data.setupA, data.setupB);
      broadcast({ type: 'update', state: gameState });
    } else if (data.type === 'move') {
      const { player, piece, move } = data;
      if (player === gameState.currentPlayer) {
        if (handleMove(player, piece, move)) {
          broadcast({ type: 'update', state: gameState });
          const winner = checkWinCondition();
          if (winner) {
            broadcast({ type: 'gameOver', winner });
          }
        } else {
          ws.send(JSON.stringify({ type: 'error', message: 'Invalid move!' }));
        }
      } else {
        ws.send(JSON.stringify({ type: 'error', message: 'Not your turn!' }));
      }
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

server.listen(8080, () => {
    console.log('WebSocket server running on ws://localhost:8080');
  });
  
  

console.log('WebSocket server running on ws://localhost:8081');
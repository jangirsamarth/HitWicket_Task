import React, { useEffect, useState } from 'react';

const GameBoard = ({ socket }) => {
  const [gameState, setGameState] = useState({
    board: Array(5).fill().map(() => Array(5).fill(null)),
    currentPlayer: 'A',
    players: { A: [], B: [] },
  });
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [validMoves, setValidMoves] = useState([]);

  useEffect(() => {
    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      switch (message.type) {
        case 'init':
        case 'update':
          setGameState(message.state);
          setSelectedPiece(null);
          setValidMoves([]);
          break;
        case 'error':
          alert(message.message);
          break;
        case 'gameOver':
          alert(`Game Over! Player ${message.winner} wins!`);
          break;
        default:
          break;
      }
    };
  }, [socket]);

  const getValidMoves = (piece) => {
    const [type] = piece.split('-')[1];
    switch (type) {
      case 'P':
        return ['L', 'R', 'F', 'B'];
      case 'H1':
        return ['L', 'R', 'F', 'B'];
      case 'H2':
        return ['FL', 'FR', 'BL', 'BR'];
      default:
        return [];
    }
  };

  const handleCellClick = (row, col) => {
    const piece = gameState.board[row][col];
    if (piece && piece.startsWith(gameState.currentPlayer)) {
      setSelectedPiece({ row, col, piece });
      setValidMoves(getValidMoves(piece));
    } else if (selectedPiece) {
      // Attempt to move
      const move = getMoveDirection(selectedPiece.row, selectedPiece.col, row, col);
      if (validMoves.includes(move)) {
        const [, pieceName] = selectedPiece.piece.split('-');
        socket.send(JSON.stringify({
          type: 'move',
          player: gameState.currentPlayer,
          piece: pieceName,
          move: move,
        }));
        setSelectedPiece(null);
        setValidMoves([]);
      }
    }
  };

  const getMoveDirection = (fromRow, fromCol, toRow, toCol) => {
    const rowDiff = toRow - fromRow;
    const colDiff = toCol - fromCol;
    const player = gameState.currentPlayer;

    if (Math.abs(rowDiff) === 2 && Math.abs(colDiff) === 2) {
      if (rowDiff > 0 && colDiff < 0) return player === 'A' ? 'FL' : 'BR';
      if (rowDiff > 0 && colDiff > 0) return player === 'A' ? 'FR' : 'BL';
      if (rowDiff < 0 && colDiff < 0) return player === 'A' ? 'BL' : 'FR';
      if (rowDiff < 0 && colDiff > 0) return player === 'A' ? 'BR' : 'FL';
    } else if (Math.abs(rowDiff) === 2 || Math.abs(colDiff) === 2) {
      if (rowDiff === 2) return player === 'A' ? 'F' : 'B';
      if (rowDiff === -2) return player === 'A' ? 'B' : 'F';
      if (colDiff === 2) return 'R';
      if (colDiff === -2) return 'L';
    } else {
      if (rowDiff === 1) return player === 'A' ? 'F' : 'B';
      if (rowDiff === -1) return player === 'A' ? 'B' : 'F';
      if (colDiff === 1) return 'R';
      if (colDiff === -1) return 'L';
    }
  };

  const renderCell = (row, col) => {
    const piece = gameState.board[row][col];
    const isSelected = selectedPiece && selectedPiece.row === row && selectedPiece.col === col;
    const cellClass = `cell ${isSelected ? 'selected' : ''}`;

    return (
      <div
        key={`${row}-${col}`}
        className={cellClass}
        onClick={() => handleCellClick(row, col)}
      >
        {piece}
      </div>
    );
  };

  const renderMoveButtons = () => {
    return (
      <div className="move-buttons">
        {validMoves.map(move => (
          <button 
            key={move} 
            onClick={() => {
              const [, pieceName] = selectedPiece.piece.split('-');
              socket.send(JSON.stringify({
                type: 'move',
                player: gameState.currentPlayer,
                piece: pieceName,
                move: move,
              }));
              setSelectedPiece(null);
              setValidMoves([]);
            }}
          >
            {move}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div>
      <div className="board">
        {gameState.board.map((row, rowIndex) =>
          row.map((_, colIndex) => renderCell(rowIndex, colIndex))
        )}
      </div>
      {selectedPiece && renderMoveButtons()}
      <div>Current Player: {gameState.currentPlayer}</div>
    </div>
  );
};

export default GameBoard;
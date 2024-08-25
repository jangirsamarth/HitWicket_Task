import React, { useEffect, useState } from 'react';
import GameBoard from './GameBoard';

const App = () => {
  const [socket, setSocket] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);

  useEffect(() => {

    const newSocket = new WebSocket('ws://localhost:8080');


    newSocket.onopen = () => {
      console.log('WebSocket connection established');
    };

    newSocket.onclose = () => {
      console.log('WebSocket connection closed');
    };

    newSocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

   
    setSocket(newSocket);

  
    return () => {
      if (newSocket) {
        newSocket.close();
      }
    };
  }, []); 

  const startGame = () => {
    if (socket && socket.readyState === WebSocket.OPEN) {
     
      socket.send(JSON.stringify({
        type: 'start',
        setupA: ['P1', 'P2', 'H1', 'H2', 'P3'],
        setupB: ['P1', 'P2', 'H1', 'H2', 'P3'],
      }));
      setGameStarted(true);
    } else {
      console.error('WebSocket is not connected');
      
    }
  };

  return (
    <div className="App">
      {!gameStarted && (
        <button onClick={startGame} disabled={!socket || socket.readyState !== WebSocket.OPEN}>
          Start Game
        </button>
      )}
      {gameStarted && socket && <GameBoard socket={socket} />}
    </div>
  );
};

export default App;
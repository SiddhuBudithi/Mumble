import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Lobby from './Components/Lobby.jsx';
import Room from './Components/Room.jsx';


function App() {
  return (
    <Router>
    <Routes>
        <Route path="/" element={<Lobby />} />
        <Route path="/room/:roomName/*" element={<Room />} />
        
    </Routes>
</Router>
);
}

export default App;

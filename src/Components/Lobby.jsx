import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './CSS/Lobby.css';
import { v4 as uuidv4 } from 'uuid';

const Lobby = () => {
    const [name, setName] = useState('');
    const [roomName, setRoomName] = useState('');
    const navigate = useNavigate();

    const handleJoinRoom = () => {
        if (name && roomName) {
            navigate(`/room/${roomName}`, { state: { userName: name } });
        } else {
            alert('Please enter your name and room name');
        }
    };

    const handleCreateRoom = () => {
        const newRoomName = roomName || uuidv4(); // Generate a unique room name if not provided
        if (name) {
            navigate(`/room/${newRoomName}`, { state: { userName: name } });
        } else {
            alert('Please enter your name');
        }
    };

    return (
        <div className="lobby-container">
            <header className="lobby-header">
                <div className="logo">Site Logo</div>
                <div className="title">Mumble</div>
                <button className="create-room-btn" onClick={handleCreateRoom}>Create Room</button>
            </header>
            <div className="lobby-form">
                <h2>🔥 Create or Join Room</h2>
                <div className="input-group">
                <label htmlFor="roomName">Room Name:</label>
                <input
                    type="text"
                    id="roomName"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                />
            </div>
            <div className="input-group">
                <label htmlFor="userName">Your Name:</label>
                <input
                    type="text"
                    id="userName"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
            </div>
            <div className="buttons">
            <button onClick={handleJoinRoom}>Go to Room ➔</button>
            </div>
            </div>
        </div>
    );
};

export default Lobby;

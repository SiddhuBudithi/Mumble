import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './CSS/Lobby.css';

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
        if (roomName && name) {
            // Redirect to the room creation page with the room name
            navigate(`/room/${roomName}`, { state: { userName: name } });
        } else {
            alert('Please enter both room name and your name.');
        }
    };

    return (
        <div className="lobby-container">
            <header className="lobby-header">
                <div className="logo">Site Logo</div>
                <div className="title">Mumble</div>
                <button className="create-room-btn">Create Room</button>
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
                <button onClick={handleCreateRoom}>Create Room</button>
                <button onClick={handleJoinRoom}>Join Room</button>
            </div>
            </div>
        </div>
    );
};

export default Lobby;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './CSS/Lobby.css';
import { v4 as uuidv4 } from 'uuid';

const Lobby = () => {
    const [name, setName] = useState('');
    const [roomName, setRoomName] = useState('');
    const navigate = useNavigate();

    // Generate a unique ID for the user (could be used as uid)
    const generateUid = () => uuidv4();

    // Helper function to ensure the room name is valid
    const validateRoomName = (roomName) => {
        const regex = /^[a-zA-Z0-9 !#$%&()+\-:;<=>?@[\]^_{|}~,.]+$/;
        return regex.test(roomName) && roomName.length <= 64;
    };

    const handleJoinRoom = () => {
        if (name && validateRoomName(roomName)) {
            const uid = generateUid();
            navigate(`/room/${roomName}/new-interview`, { 
                state: { userName: name, roomId: roomName, uid } 
            });
        } else {
            alert('Please enter a valid name and room name (up to 64 characters with supported characters)');
        }
    };

    const handleCreateRoom = () => {
        const newRoomName = roomName || uuidv4().slice(0, 20); // Generate a unique room name if not provided
        if (name) {
            const uid = generateUid();
            navigate(`/room/${newRoomName}/new-interview`, { 
                state: { userName: name, roomId: newRoomName, uid } 
            });
        } else {
            alert('Please enter your name');
        }
    };

    return (
        <div className="lobby-container">
            <header className="lobby-header">
                <div className="logo"><img src="/logosite2.png" alt="Site Logo" style={{ height: '40px' , marginLeft:'30px'}} /></div>
                <div className="title">Webstaff Interview panel</div>
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

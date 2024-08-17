import React from 'react';
import { Routes, Route, Link, useParams, useResolvedPath } from 'react-router-dom';
import InterviewListComponent from './InterviewListComponent';
import NewInterviewComponent from './NewInterviewComponent';
import './CSS/Room.css';

const Room = () => {
    const { roomName } = useParams();
    const resolvedPath = useResolvedPath(`/room/${roomName}`);

    return (
        <div className="room-container">
            <aside className="sidebar">
                <h2>WEBSTAFF</h2>
                <ul>
                    <li><Link to={`${resolvedPath.pathname}/new-interview`}>New Interview</Link></li>
                    <li><Link to={`${resolvedPath.pathname}/interview-list`}>Interview List</Link></li>
                </ul>
            </aside>
            <div className="content">
                <Routes>
                    <Route path="new-interview" element={<NewInterviewComponent />} />
                    <Route path="interview-list" element={<InterviewListComponent />} />
                </Routes>
            </div>
        </div>
    );
};

export default Room;

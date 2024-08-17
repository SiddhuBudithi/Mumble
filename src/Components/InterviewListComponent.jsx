
import React from 'react';
import './CSS/InterviewListComponent.css'; 

const InterviewListComponent = () => {
    const interviews = [
        {
            id: 1,
            date: '2024-08-01',
            userName: 'UserName',
            movieTitle: 'Movie Title, Movie Title, Movie Title, Movie Title, Movie Title, Movie Title',
            userImage: 'https://via.placeholder.com/100' 
        },
        {
            id: 2,
            date: '2024-08-01',
            userName: 'UserName',
            movieTitle: 'Movie Title, Movie Title, Movie Title, Movie Title, Movie Title, Movie Title',
            userImage: 'https://via.placeholder.com/100' 
        }
    ];

    return (
        <div className="interview-list-container">
            <h2>Interview List</h2>
            <div className="search-box">
                <input type="text" placeholder="Search Box" />
                <button>GO!</button>
            </div>
            {interviews.map(interview => (
                <div key={interview.id} className="interview-item">
                    <div className="interview-image">
                        <img src={interview.userImage} alt="User" />
                    </div>
                    <div className="interview-info">
                        <p className="interview-date">{interview.date}</p>
                        <p className="interview-username">{interview.userName}</p>
                        <p className="interview-movie-title">{interview.movieTitle}</p>
                    </div>
                    <div className="edit-icon">
                        <button>✏️</button>
                    </div>
                </div>
            ))}
            <div className="pagination">
                <button className="pagination-button">1</button>
                <button className="pagination-button">2</button>
                <button className="pagination-button">3</button>
            </div>
        </div>
    );
};

export default InterviewListComponent;

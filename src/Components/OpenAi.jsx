import React, { useState } from 'react';
import openai from 'openai';


openai.apiKey = process.env.REACT_APP_OPENAI_API_KEY;

const NewInterviewComponent = () => {
    const [chatMessages, setChatMessages] = useState([]);
    const [translatedMessages, setTranslatedMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');


    const translateMessage = async (message, targetLanguage) => {
        try {
            const response = await openai.ChatCompletion.create({
                model: "gpt-4",
                messages: [
                    {
                        role: "system",
                        content: `Translate the following message to ${targetLanguage}.`,
                    },
                    {
                        role: "user",
                        content: message,
                    },
                ],
            });

            const translatedText = response.choices[0].message.content.trim();
            return translatedText;
        } catch (error) {
            console.error("Error translating message:", error);
            return "[Translation Error] " + message;
        }
    };

    // Function to handle sending messages
    const handleSendMessage = async () => {
        const message = inputValue.trim();
        if (!message) return;

        const newMessage = { text: message, sender: 'self' };
        setChatMessages([...chatMessages, newMessage]);

        const translatedMessage = await translateMessage(message, 'Japanese');
        const translatedObj = { text: translatedMessage, sender: 'self' };
        setTranslatedMessages([...translatedMessages, translatedObj]);

        setInputValue(''); // Clear input after sending
    };

    // Function to handle receiving messages
    const handleReceiveMessage = async (message) => {
        const newMessage = { text: message, sender: 'other' };
        setChatMessages([...chatMessages, newMessage]);

        const translatedMessage = await translateMessage(message, 'English');
        const translatedObj = { text: translatedMessage, sender: 'other' };
        setTranslatedMessages([...translatedMessages, translatedObj]);
    };

    // Handle input changes
    const handleInputChange = (e) => {
        setInputValue(e.target.value);
    };

    // Handle key down for 'Enter' key
    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSendMessage();
        }
    };

    return (
        <div className="interview-container">
            {/* Chat and Translation Panels */}
            <div className="interview-chat-panel">
                <div className="tabs">
                    <button className="tab active">Translation</button>
                    <button className="tab">Chat</button>
                </div>
                <div className="chat-content">
                    {chatMessages.map((msg, index) => (
                        <div key={index} className={`chat-bubble ${msg.sender}`}>
                            {msg.text}
                        </div>
                    ))}
                </div>
                <div className="chat-input">
                    <input
                        type="text"
                        placeholder="Enter text"
                        value={inputValue}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                    />
                    <button className="send-btn" onClick={handleSendMessage}>➤</button>
                </div>
            </div>

            {/* Translation Display */}
            <div className="interview-header">
                <p className="translation-results">
                    {translatedMessages.map((msg, index) => (
                        <span key={index} className={`translation-bubble ${msg.sender}`}>
                            {msg.text}
                        </span>
                    ))}
                </p>
            </div>
        </div>
    );
};

export default NewInterviewComponent;

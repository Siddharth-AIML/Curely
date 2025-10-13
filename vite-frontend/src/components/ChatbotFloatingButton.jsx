import React, { useState } from 'react';
import ChatbotUI from './ChatbotUI'; // Import the main chat UI component

const ChatbotFloatingButton = () => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleChat = () => {
        setIsOpen(!isOpen);
    };

    return (
        <>
            {/* The Chat UI component, conditionally rendered */}
            {isOpen && (
                <div style={styles.chatWindow}>
                    <ChatbotUI onClose={toggleChat} />
                </div>
            )}

            {/* The Floating Button */}
            <button
                onClick={toggleChat}
                style={styles.floatingButton}
                title={isOpen ? "Close Chat" : "Open Symptom Chatbot"}
            >
                {/* Icon based on state */}
                {isOpen ? '❌' : '💬'} 
            </button>
        </>
    );
};

const styles = {
    floatingButton: {
        position: 'fixed',
        bottom: '30px',
        right: '30px',
        width: '60px',
        height: '60px',
        borderRadius: '50%',
        backgroundColor: '#007BFF', // Match your branding color
        color: 'white',
        border: 'none',
        fontSize: '24px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
        cursor: 'pointer',
        zIndex: 1000,
    },
    chatWindow: {
        position: 'fixed',
        bottom: '100px',
        right: '30px',
        zIndex: 999,
    },
};

export default ChatbotFloatingButton;
import React, { useState, useRef, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { analyzeSymptoms } from '/src/services/api.js';

const ChatbotUI = ({ onClose }) => {
    const [messages, setMessages] = useState([
        { sender: 'bot', text: "Hello! I'm CURELY's Symptom Bot. Describe your symptoms and I will identify which ones the model supports." }
    ]);
    const [input, setInput] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };
    useEffect(scrollToBottom, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        const userMessage = input.trim();
        if (!userMessage || isThinking) return;

        setMessages(prev => [...prev, { sender: 'user', text: userMessage }]);
        setInput('');
        setIsThinking(true);

        try {
            const { data } = await analyzeSymptoms({ description: userMessage });
            const lines = [];
            if (data.recognized_symptoms?.length) {
                lines.push(`Recognized and used: ${data.accepted_evidence.map((item) => item.label).join(', ')}.`);
            }
            for (const item of data.unsupported_terms || []) {
                const suggestions = item.suggestions?.length
                    ? ` Suggestions: ${item.suggestions.map((suggestion) => suggestion.label).join(', ')}.`
                    : '';
                lines.push(`Not supported by the model: "${item.term}".${suggestions}`);
            }
            for (const item of data.clarifications || []) {
                lines.push(`Clarify "${item.symptom.label}": it was reported as ${item.reason}, so it was not used as present evidence.`);
            }
            if (data.results?.length) {
                lines.push('Model-ranked hypotheses (uncalibrated estimates):');
                data.results.forEach((item, index) => {
                    lines.push(`${index + 1}. ${item.disease} — ${(item.probability * 100).toFixed(2)}%`);
                });
            } else {
                lines.push('No supported positive symptoms were identified, so no model prediction was run.');
            }
            lines.push('This trained Naive Bayes classifier is not a Bayesian Belief Network and cannot diagnose. Please consult a healthcare professional.');
            setMessages(prev => [...prev, { sender: 'bot', text: lines.join('\n'), type: 'success' }]);

        } catch (error) {
            console.error("Chatbot API error:", error);
            const errorMessage = error.response?.data?.message
                || error.response?.data?.error
                || "Symptom analysis is temporarily unavailable. Please try again later.";
            setMessages(prev => [...prev, { sender: 'bot', text: errorMessage, type: 'error' }]);
        } finally {
            setIsThinking(false);
        }
    };

    return (
        <div style={styles.container}>
            {/* ... (Header and other JSX) ... */}
            <div style={styles.header}>
                <h4 style={{ margin: 0 }}>CURELY Symptom Bot</h4>
                <button onClick={onClose} style={styles.closeButton}>X</button>
            </div>
            
            {/* Message Display Area */}
            <div style={styles.messagesArea}>
                {messages.map((msg, index) => (
                    <div 
                        key={index} 
                        style={{ 
                            ...styles.messageContainer,
                            textAlign: msg.sender === 'user' ? 'right' : 'left'
                        }}
                    >
                        <span
                            style={{
                                ...(msg.sender === 'user' ? styles.userBubble : styles.botBubble),
                                ...(msg.type === 'success' && styles.successBubble),
                                ...(msg.type === 'error' && styles.errorBubble),
                                whiteSpace: 'pre-line',
                            }}
                        >
                            {msg.text}
                        </span>
                    </div>
                ))}
                {/* Thinking Indicator */}
                {isThinking && (
                     <div style={{...styles.messageContainer, textAlign: 'left',}}>
                         <span style={{...styles.botBubble, backgroundColor: '#f0f8ff', color: '#007BFF', fontStyle: 'italic', display: 'flex', alignItems: 'center'}}>
                             <Loader2 size={14} style={{ marginRight: '5px', animation: 'spin 1s linear infinite' }} />
                             Thinking...
                         </span>
                     </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            
            {/* Input Form */}
            <form onSubmit={handleSendMessage} style={styles.inputForm}>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={isThinking ? "Please wait..." : "Type your symptoms..."}
                    style={styles.inputField}
                    disabled={isThinking}
                />
                <button type="submit" style={styles.sendButton} disabled={isThinking}>Send</button>
            </form>
        </div>
    );
};


// Define animation for the spinner (since we are using inline styles)
const styleSheet = document.createElement('style');
styleSheet.type = 'text/css';
styleSheet.innerText = `
@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
`;
document.head.appendChild(styleSheet);


const styles = {
    // ... (rest of styles object remains unchanged)
    container: {
        width: '350px',
        height: '450px',
        backgroundColor: 'white',
        border: '1px solid #007BFF', // Border color
        borderRadius: '8px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
    },
    header: {
        padding: '10px',
        backgroundColor: '#007BFF',
        color: 'white',
        borderTopLeftRadius: '8px',
        borderTopRightRadius: '8px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    closeButton: {
        background: 'none',
        border: 'none',
        color: 'white',
        fontSize: '18px',
        cursor: 'pointer',
    },
    messagesArea: {
        flexGrow: 1,
        overflowY: 'auto',
        padding: '10px',
    },
    messageContainer: {
        marginBottom: '10px',
    },
    userBubble: {
        display: 'inline-block',
        padding: '8px 12px',
        borderRadius: '15px 15px 0 15px',
        maxWidth: '70%',
        backgroundColor: '#DCF8C6',
        wordBreak: 'break-word',
    },
    botBubble: {
        display: 'inline-block',
        padding: '8px 12px',
        borderRadius: '15px 15px 15px 0',
        maxWidth: '70%',
        backgroundColor: '#F1F0F0',
        textAlign: 'left',
        wordBreak: 'break-word',
    },
    successBubble: {
        backgroundColor: '#d4edda',
        color: '#155724',
        border: '1px solid #c3e6cb'
    },
    errorBubble: {
        backgroundColor: '#f8d7da',
        color: '#721c24',
        border: '1px solid #f5c6cb'
    },
    inputForm: {
        padding: '10px',
        borderTop: '1px solid #ccc',
        display: 'flex',
    },
    inputField: {
        flexGrow: 1,
        padding: '10px',
        border: '1px solid #ccc',
        borderRadius: '5px 0 0 5px',
    },
    sendButton: {
        padding: '10px 15px',
        backgroundColor: '#007BFF',
        color: 'white',
        border: 'none',
        borderRadius: '0 5px 5px 0',
        cursor: 'pointer',
    },
    // NEW STYLE FOR REDIRECTION BUTTON
    redirectButton: {
        display: 'block',
        marginTop: '10px',
        padding: '8px 12px',
        backgroundColor: '#3b82f6', // Tailwind blue
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontWeight: 'bold',
        cursor: 'pointer',
        textAlign: 'center',
        textDecoration: 'none',
        transition: 'background-color 0.2s',
    }
};

export default ChatbotUI;

import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios'; 
import { Loader2 } from 'lucide-react';
// FIX: Import useNavigate for redirection
import { useNavigate } from 'react-router-dom'; 

// --- Helper Functions (Symptom Extraction and Cleaning - Unchanged) ---
const STOP_WORDS = new Set([
  'and', 'or', 'the', 'a', 'an', 'i', 'am', 'is', 'are', 'was', 'were', 'have', 'has', 
  'with', 'but', 'for', 'of', 'in', 'out', 'my', 'his', 'her', 'its', 'their', 'like', 'some', 'any', 
  'im', 'ive', 'not', 'no', 'so', 'feeling', 'feel', 'i’m', 'to', 'at', 'about', 'terrible', 'bad', 
  'pain', 'ache', 'sore', 'severe', 'mild', 'chronic', 'sudden',
  'got', 'having' 
]);

const extractAndCleanSymptoms = (text) => {
    const lowerText = text.toLowerCase().trim();
    
    const prefixes = [
        "i am feeling", "i have", "my symptoms are", "i'm feeling", "i feel", 
        "symptoms", "check for", "im having", "i got"
    ];
    let cleanedText = lowerText;
    for (const prefix of prefixes) {
        if (lowerText.startsWith(prefix)) {
            cleanedText = lowerText.substring(prefix.length).trim().replace(/^[,:]\s*/, '');
            break;
        }
    }
    
    return cleanedText
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"") 
        .split(/[,\s]+/) 
        .map((s) => s.trim())
        .filter(s => s.length > 2 && !STOP_WORDS.has(s));
};

const ChatbotUI = ({ onClose }) => {
    // FIX: Initialize useNavigate
    const navigate = useNavigate(); 
    
    const [messages, setMessages] = useState([
        { sender: 'bot', text: "Hello! I'm CURELY's Symptom Bot. Please list your main symptoms to begin." }
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
            const symptomsList = extractAndCleanSymptoms(userMessage);

            if (symptomsList.length === 0) {
                 setMessages(prev => [...prev, { sender: 'bot', text: "I couldn't identify any clear symptoms. Please enter specific symptoms." }]);
                 setIsThinking(false);
                 return;
            }

            // Display analysis message before API call
            setMessages(prev => [...prev, { sender: 'bot', text: `Analyzing symptoms: ${symptomsList.join(', ')}...` }]);

            const response = await axios.post('/bbn-api/questions', { 
                symptoms: symptomsList 
            });
            
            const questions = response.data.questions;
            const questionCount = Object.values(questions).flat().length;


            if (questions && Object.keys(questions).length > 0) {
                // FIX: Instead of printing questions, prompt user to go to the full page.
                setMessages(prev => [...prev, { 
                    sender: 'bot', 
                    // Store the symptom data in local storage or context/global state before redirecting
                    // For now, we'll just redirect and assume the full page handles the flow initiation.
                    text: `Success! I've found ${questionCount} relevant questions for your assessment. You must use the full dashboard page to answer them.`,
                    type: 'success',
                    action: 'redirect' // Custom flag to render the button
                }]);
            } else {
                setMessages(prev => [...prev, { 
                    sender: 'bot', 
                    text: "I found your symptoms, but I cannot proceed with the assessment. Please try the full Symptom Checker page directly.",
                    type: 'error'
                }]);
            }

        } catch (error) {
            console.error("Chatbot API error:", error);
            let errorMessage = "Sorry, I lost connection to the symptom analysis service. Please check the backend server (Port 5000) and try refreshing.";
            if (error.response && error.response.status === 404) {
                 errorMessage = "Connection error. Please ensure the Python BBN server is running and the Vite proxy is set up correctly.";
            }

            setMessages(prev => [...prev, { sender: 'bot', text: errorMessage, type: 'error' }]);
        } finally {
            setIsThinking(false);
        }
    };

    // Component to render the redirection button
    const RedirectButton = () => (
        <button
            onClick={() => {
                onClose(); // Close the floating chat window
                navigate('/customer/symptom-checker'); // Redirect to the full page
            }}
            style={styles.redirectButton}
        >
            Go to Full Assessment →
        </button>
    );

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
                            }}
                            dangerouslySetInnerHTML={{ __html: msg.text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br/>') }}
                        />
                         {/* FIX: Render redirect button after success message */}
                        {msg.type === 'success' && msg.action === 'redirect' && <RedirectButton />}
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

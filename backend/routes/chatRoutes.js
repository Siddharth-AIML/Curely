const express = require('express');
const axios = require('axios');
const router = express.Router();

// 🚨 IMPORTANT: This URL must match the port your Python api.py is running on (5000).
const PYTHON_SERVICE_URL = 'http://localhost:5000'; 

// POST /api/chat
// This receives the message from the React frontend and forwards it to Python.
router.post('/', async (req, res) => {
    // 1. Get the 'message' key sent from the React frontend
    const userMessage = req.body.message;

    if (!userMessage) {
        return res.status(400).json({ error: 'No message provided in the request body.' });
    }

    try {
        // 2. Forward the user message to the Python API's chatbot endpoint
        const response = await axios.post(`${PYTHON_SERVICE_URL}/chatbot_response`, {
            message: userMessage
        });

        // 3. Send the entire JSON response from the Python service back to React
        // This includes the required 'bot_message' key.
        res.status(200).json(response.data);

    } catch (error) {
        console.error('Error calling Python Chatbot Service:', error.message);
        
        // Handle connection failure gracefully
        if (error.code === 'ECONNREFUSED' || error.response === undefined) {
             return res.status(503).json({ error: 'Chat service is offline. Please ensure the Python API (Port 5000) is running.' });
        }

        // Handle errors returned by the Python API
        return res.status(error.response.status || 500).json({ 
            error: 'An error occurred while processing the chat message.',
            details: error.response.data || 'Unknown error'
        });
    }
});

module.exports = router;
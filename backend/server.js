const express = require('express');
const connectDB = require('./config/db');
const cors = require('cors');
// Import the 'path' module to work with file paths
const path = require('path'); 
const app = express();
const PORT = process.env.PORT || 3001;
const chatRoutes = require('./routes/chatRoutes'); 

// Connect to Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// ----------------------------------------------------------------------------------
// CRITICAL FIX: Add Static File Serving for Uploaded Reports
// This maps the public URL prefix '/uploads' to the physical 'uploads' directory
// on your server, allowing files like PDFs to be served directly by the browser.
// The path.join() ensures this works correctly across different operating systems.
// ----------------------------------------------------------------------------------
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => {
    res.send("Welcome to Curely API");
});

// --- ROUTE HANDLERS ---
// Base routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/customer", require("./routes/customer"));
app.use("/api/doctor", require("./routes/doctor")); 
app.use("/api/medical", require("./routes/medical"));
app.use("/api/appointments", require("./routes/appointment"));

// New Routes for Lab Features
app.use("/api/lab", require("./routes/lab")); // For Lab user profile, settings, etc.
app.use("/api/reports", require("./routes/reports")); // For all lab test requests, uploads, and customer/doctor viewing.

// Chat Route
app.use('/api/chat', chatRoutes); 

app.listen(PORT, () => {
    console.log(`Server Listening at http://localhost:${PORT}`);
});
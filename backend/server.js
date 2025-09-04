const express = require('express');
const connectDB = require('./config/db');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3001;
connectDB();

app.use(cors());
app.use(express.json());

// This line is redundant and can be removed, as express.json() handles it.
// app.use(express.json({urlencoded: true})); 

app.get('/', (req, res) => {
    res.send("welcome to Curely API");
});

// --- CORRECTED ROUTE ORDER ---
app.use("/api/auth", require("./routes/auth"));
app.use("/api/customer", require("./routes/customer"));
app.use("/api/doctor", require("./routes/doctor")); 
app.use("/api/medical", require("./routes/medical"));
app.use("/api/appointments", require("./routes/appointment"));

app.listen(PORT, () => {
    console.log(`Server Listening at http://localhost:${PORT}`);
});


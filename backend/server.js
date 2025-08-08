const express = require('express');
const connectDB = require('./config/db')
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3001;
connectDB();

app.use(cors());
app.use(express.json());

app.use(express.json({urlencoded: true}));

app.get('/', (req,res)=>{
    res.send("welcome to Curely API");
});
app.use("/api/auth", require("./routes/auth"));
app.use("/api/customer", require("./routes/customer"));
app.use("/api/doctor" , require("./routes/doctor"));
app.listen(PORT, ()=>{
    console.log(`Server Listening at http://localhost:${PORT}`);
})
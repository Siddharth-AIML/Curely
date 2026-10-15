const express = require('express');
const { spawn, spawnSync } = require('node:child_process');
const connectDB = require('./config/db');
const cors = require('cors');
// Import the 'path' module to work with file paths
const fs = require('node:fs');
const path = require('node:path');
const app = express();
const PORT = process.env.PORT || 3001;
const chatRoutes = require('./routes/chatRoutes'); 

// Connect to Database
connectDB();

// Middleware
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000"
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (!allowedOrigins.includes(origin)) {
        return callback(new Error("CORS not allowed"), false);
      }

      return callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

app.options(/.*/, cors());

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

const aiRoutes = require("./routes/ai");

app.use(
    "/api/ai",
    aiRoutes
);

app.use("/api/symptoms", require("./routes/symptomChecker"));

const symptomServiceUrl = new URL(
  process.env.SYMPTOM_SERVICE_URL || 'http://127.0.0.1:5000'
);
const localHosts = new Set(['127.0.0.1', 'localhost', '[::1]']);
let symptomServiceProcess;
let isShuttingDown = false;

if (localHosts.has(symptomServiceUrl.hostname)) {
  if (symptomServiceUrl.protocol !== 'http:') {
    throw new Error('The local symptom service must use HTTP.');
  }

  const symptomServiceDirectory = path.join(__dirname, 'symptom_service');
  const virtualEnvironmentPython = path.join(
    symptomServiceDirectory,
    '.venv',
    process.platform === 'win32' ? 'Scripts' : 'bin',
    process.platform === 'win32' ? 'python.exe' : 'python'
  );
  const pythonExecutable = process.env.SYMPTOM_PYTHON
    || (fs.existsSync(virtualEnvironmentPython)
      ? virtualEnvironmentPython
      : process.platform === 'win32' ? 'python' : 'python3');
  const symptomServiceHost = symptomServiceUrl.hostname === 'localhost'
    ? '127.0.0.1'
    : symptomServiceUrl.hostname === '[::1]' ? '::1' : symptomServiceUrl.hostname;

  symptomServiceProcess = spawn(
    pythonExecutable,
    [
      '-m',
      'uvicorn',
      'api:app',
      '--host',
      symptomServiceHost,
      '--port',
      symptomServiceUrl.port || '80',
    ],
    {
      cwd: symptomServiceDirectory,
      stdio: 'inherit',
    }
  );
  symptomServiceProcess.on('error', (error) => {
    console.error('Unable to start the symptom service:', error.message);
  });
  symptomServiceProcess.on('exit', (code, signal) => {
    if (!isShuttingDown) {
      console.error(`Symptom service stopped unexpectedly (code ${code}, signal ${signal}).`);
    }
  });
} else {
  console.log(`Using external symptom service at ${symptomServiceUrl.origin}.`);
}

const server = app.listen(PORT, () => {
    console.log(`Server Listening at http://localhost:${PORT}`);
});

const stopSymptomService = () => {
  if (
    !symptomServiceProcess
    || !symptomServiceProcess.pid
    || symptomServiceProcess.exitCode !== null
    || symptomServiceProcess.signalCode !== null
  ) {
    return;
  }
  if (process.platform === 'win32') {
    const result = spawnSync(
      'taskkill',
      ['/PID', String(symptomServiceProcess.pid), '/T', '/F'],
      { stdio: 'ignore' }
    );
    if (result.error || result.status !== 0) {
      console.error('Unable to stop the symptom service process tree:', result.error?.message || result.status);
    }
    return;
  }
  symptomServiceProcess.kill();
};

const shutdown = () => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  server.close();
  stopSymptomService();
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
process.on('exit', () => {
  if (!isShuttingDown) stopSymptomService();
});
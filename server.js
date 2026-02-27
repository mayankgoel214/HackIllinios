require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const OpenAI = require('openai');
const Supermemory = require('supermemory').default;

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize API clients
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const supermemory = new Supermemory({ apiKey: process.env.SUPERMEMORY_API_KEY });

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', project: 'MindLink' });
});

// Load route modules
require('./routes/whisper')(app, openai);
require('./routes/memories')(app, supermemory);
require('./routes/chat')(app, openai, supermemory);
require('./routes/recall')(app, openai, supermemory);
require('./routes/graph')(app, supermemory);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`MindLink server running on http://localhost:${PORT}`);
});

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.json());
app.use(cors());

// Simple JSON Database implementation (replacing MongoDB)
const DB_FILE = path.join(__dirname, 'db.json');

// Initialize DB if not exists
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify({ submissions: [], results: [] }));
}

const getDb = () => {
  try {
    const content = fs.readFileSync(DB_FILE, 'utf8');
    return content ? JSON.parse(content) : { submissions: [], results: [] };
  } catch (e) {
    return { submissions: [], results: [] };
  }
};
const saveDb = (data) => fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));

const calculateScore = (submission, results) => {
  if (!results || results.length === 0) return 0;
  let score = 0;
  submission.standings.forEach(userGroup => {
    const officialGroup = results.find(g => g.groupName === userGroup.groupName);
    if (officialGroup) {
      userGroup.teams.forEach((team, index) => {
        if (officialGroup.teams[index] === team) {
          score += 1;
        }
      });
    }
  });
  return score;
};

app.post('/api/check-email', async (req, res) => {
  try {
    const { email } = req.body;
    const db = getDb();
    const existing = db.submissions.find(s => s.email === email);
    if (existing) {
      existing.score = calculateScore(existing, db.results || []);
    }
    res.json({ 
      exists: !!existing,
      userSubmission: existing || null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/submissions', async (req, res) => {
  try {
    const db = getDb();
    const results = db.results || [];
    const submissionsWithScores = db.submissions.map(s => ({
      ...s,
      score: calculateScore(s, results)
    }));
    res.json(submissionsWithScores);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/results', (req, res) => {
  try {
    const db = getDb();
    res.json(db.results || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/results', (req, res) => {
  try {
    const { results } = req.body;
    const db = getDb();
    db.results = results;
    saveDb(db);
    res.json({ message: 'Results updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/scoreboard', (req, res) => {
  try {
    const db = getDb();
    const results = db.results || [];
    const scoreboard = db.submissions.map(s => ({
      email: s.email,
      score: calculateScore(s, results),
      createdAt: s.createdAt
    })).sort((a, b) => b.score - a.score || new Date(a.createdAt) - new Date(b.createdAt));
    
    res.json(scoreboard);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/submit', async (req, res) => {
  try {
    const { email, standings } = req.body;
    const db = getDb();
    
    if (db.submissions.find(s => s.email === email)) {
      return res.status(400).json({ error: 'This email has already submitted.' });
    }

    const newSubmission = { 
      email, 
      standings, 
      createdAt: new Date().toISOString() 
    };
    
    db.submissions.push(newSubmission);
    saveDb(db);
    
    res.status(201).json({ message: 'Submitted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;

app.use(express.static(path.join(__dirname, '../frontend/dist')));

app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist', 'index.html'));
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

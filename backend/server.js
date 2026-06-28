require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

// Simple JSON Database implementation (replacing MongoDB)
const DB_FILE = path.join(__dirname, 'db.json');

// Initialize DB if not exists
const DEFAULT_SETTINGS = { submissionsEnabled: true, knockoutEnabled: false };

if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify({ submissions: [], results: [], settings: { ...DEFAULT_SETTINGS } }));
}

const getDb = () => {
  try {
    const content = fs.readFileSync(DB_FILE, 'utf8');
    const data = content ? JSON.parse(content) : { submissions: [], results: [], settings: { ...DEFAULT_SETTINGS } };
    if (!data.settings) data.settings = { ...DEFAULT_SETTINGS };
    if (data.settings.knockoutEnabled === undefined) data.settings.knockoutEnabled = false;
    return data;
  } catch (e) {
    return { submissions: [], results: [], settings: { ...DEFAULT_SETTINGS } };
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

// Knockout scoring: per match, exact score = 10, correct winner only = 3, else 0.
// A predicted match only counts if its two teams match the official match's teams
// (i.e. the user correctly predicted who reached that bracket slot).
const KO_ROUNDS = ['R32', 'R16', 'QF', 'SF', 'F'];

const isBlank = (v) => v === null || v === undefined || v === '';

const koMatchPoints = (userMatch, officialMatch) => {
  if (!userMatch || !officialMatch) return 0;
  if (!userMatch.teamA || !userMatch.teamB || !officialMatch.teamA || !officialMatch.teamB) return 0;
  if (userMatch.teamA !== officialMatch.teamA || userMatch.teamB !== officialMatch.teamB) return 0;
  if ([userMatch.scoreA, userMatch.scoreB, officialMatch.scoreA, officialMatch.scoreB].some(isBlank)) return 0;
  const ua = Number(userMatch.scoreA), ub = Number(userMatch.scoreB);
  const oa = Number(officialMatch.scoreA), ob = Number(officialMatch.scoreB);
  if ([ua, ub, oa, ob].some(n => Number.isNaN(n))) return 0;
  if (ua === oa && ub === ob) return 10;
  const userWinner = ua > ub ? userMatch.teamA : userMatch.teamB;
  const officialWinner = oa > ob ? officialMatch.teamA : officialMatch.teamB;
  return userWinner === officialWinner ? 3 : 0;
};

const calculateKnockoutScore = (submission, knockoutResults) => {
  if (!knockoutResults || !submission || !submission.knockout) return 0;
  let score = 0;
  KO_ROUNDS.forEach(round => {
    const userMatches = submission.knockout[round] || [];
    const officialMatches = knockoutResults[round] || [];
    officialMatches.forEach((officialMatch, i) => {
      score += koMatchPoints(userMatches[i], officialMatch);
    });
  });
  return score;
};

// Attach group, knockout and total scores to a submission for API responses.
const scoreSubmission = (submission, results, knockoutResults) => {
  const groupScore = calculateScore(submission, results);
  const knockoutScore = calculateKnockoutScore(submission, knockoutResults);
  return { ...submission, groupScore, knockoutScore, score: groupScore + knockoutScore };
};

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// API Routes
app.get('/api/settings', (req, res) => {
  try {
    const db = getDb();
    res.json(db.settings || { submissionsEnabled: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/settings', (req, res) => {
  try {
    console.log('Received settings update:', req.body);
    const { settings } = req.body;
    if (!settings) {
      return res.status(400).json({ error: 'Settings object is required' });
    }
    const db = getDb();
    db.settings = { ...db.settings, ...settings };
    saveDb(db);
    console.log('Updated settings:', db.settings);
    res.json({ message: 'Settings updated successfully', settings: db.settings });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/check-email', async (req, res) => {
  try {
    const { email } = req.body;
    const db = getDb();
    const existing = db.submissions.find(s => s.email === email);
    const scored = existing ? scoreSubmission(existing, db.results || [], db.knockoutResults) : null;
    res.json({
      exists: !!existing,
      userSubmission: scored
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/submissions', async (req, res) => {
  try {
    const db = getDb();
    const results = db.results || [];
    const submissionsWithScores = db.submissions.map(s => scoreSubmission(s, results, db.knockoutResults));
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
    const scoreboard = db.submissions.map(s => {
      const scored = scoreSubmission(s, results, db.knockoutResults);
      return {
        email: s.email,
        groupScore: scored.groupScore,
        knockoutScore: scored.knockoutScore,
        score: scored.score,
        createdAt: s.createdAt
      };
    }).sort((a, b) => b.score - a.score || new Date(a.createdAt) - new Date(b.createdAt));

    res.json(scoreboard);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/submit', async (req, res) => {
  try {
    const { email, standings } = req.body;
    const db = getDb();
    
    if (db.settings && db.settings.submissionsEnabled === false) {
      return res.status(403).json({ error: 'Submissions are currently closed by admin.' });
    }

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

// --- Knockout stage ---

// The admin-defined Round of 32: { r32: [{ teamA, teamB }, ... x16] }
app.get('/api/knockout-bracket', (req, res) => {
  try {
    res.json(getDb().knockoutBracket || null);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/knockout-bracket', (req, res) => {
  try {
    const { bracket } = req.body;
    if (!bracket || !Array.isArray(bracket.r32)) {
      return res.status(400).json({ error: 'A bracket with an r32 array is required.' });
    }
    const db = getDb();
    db.knockoutBracket = bracket;
    saveDb(db);
    res.json({ message: 'Knockout bracket saved successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Official knockout results, same shape as a user's knockout prediction.
app.get('/api/knockout-results', (req, res) => {
  try {
    res.json(getDb().knockoutResults || null);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/knockout-results', (req, res) => {
  try {
    const { results } = req.body;
    const db = getDb();
    db.knockoutResults = results;
    saveDb(db);
    res.json({ message: 'Knockout results saved successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/submit-knockout', (req, res) => {
  try {
    const { email, knockout } = req.body;
    const db = getDb();

    if (!(db.settings && db.settings.knockoutEnabled)) {
      return res.status(403).json({ error: 'Knockout predictions are currently closed by admin.' });
    }
    if (!db.knockoutBracket || !Array.isArray(db.knockoutBracket.r32)) {
      return res.status(400).json({ error: 'The knockout bracket has not been set by the admin yet.' });
    }

    const submission = db.submissions.find(s => s.email === email);
    if (!submission) {
      return res.status(400).json({ error: 'You must submit your group stage prediction before the knockout stage.' });
    }
    if (submission.knockout) {
      return res.status(400).json({ error: 'You have already submitted your knockout prediction.' });
    }
    if (!knockout || !Array.isArray(knockout.R32)) {
      return res.status(400).json({ error: 'Invalid knockout prediction data.' });
    }

    submission.knockout = knockout;
    submission.knockoutCreatedAt = new Date().toISOString();
    saveDb(db);

    res.status(201).json({ message: 'Knockout prediction submitted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generic 404 for API routes
app.all(/^\/api\/.*/, (req, res) => {
  res.status(404).json({ error: `API route not found: ${req.method} ${req.url}` });
});

const PORT = process.env.PORT || 5000;

app.use(express.static(path.join(__dirname, '../frontend/dist')));

app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist', 'index.html'));
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

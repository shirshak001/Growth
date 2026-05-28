import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Load environmental variables
dotenv.config();

// Imports routers
import authRoutes from './routes/auth.js';
import routineRoutes from './routes/routine.js';
import fitnessRoutes from './routes/fitness.js';
import moodRoutes from './routes/mood.js';
import aiRoutes from './routes/ai.js';
import periodRoutes from './routes/period.js';
import financeRoutes from './routes/finance.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const registerRoutes = (prefix) => {
  app.use(`${prefix}/auth`, authRoutes);
  app.use(`${prefix}/routine`, routineRoutes);
  app.use(`${prefix}/fitness`, fitnessRoutes);
  app.use(`${prefix}/mood`, moodRoutes);
  app.use(`${prefix}/ai`, aiRoutes);
  app.use(`${prefix}/period`, periodRoutes);
  app.use(`${prefix}/finance`, financeRoutes);
};

registerRoutes('/api');
registerRoutes('');


// Serve static assets in production (any environment other than development)
if (process.env.NODE_ENV !== 'development') {
  const distPath = path.join(__dirname, '../dist');
  const indexHtmlPath = path.resolve(distPath, 'index.html');
  
  if (fs.existsSync(indexHtmlPath)) {
    app.use(express.static(distPath));
    
    // Any non-API route should serve index.html
    app.get('*', (req, res) => {
      res.sendFile(indexHtmlPath);
    });
  } else {
    // Standalone API deployment fallback (e.g. Render backend service)
    app.get('/', (req, res) => {
      res.json({ status: "healthy", message: "Growth API is online" });
    });
    
    app.get('*', (req, res) => {
      res.status(404).json({ message: "Not Found - API is online, but static frontend assets are missing." });
    });
  }
} else {
  // Base route for development
  app.get('/', (req, res) => {
    res.send('Growth App API is running...');
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Server error occurred' });
});

// Port configuration
const PORT = process.env.PORT || 5050;

if (process.env.NODE_ENV === 'development' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;


import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environmental variables
dotenv.config();

// Imports routers
import authRoutes from './routes/auth.js';
import routineRoutes from './routes/routine.js';
import fitnessRoutes from './routes/fitness.js';
import moodRoutes from './routes/mood.js';
import aiRoutes from './routes/ai.js';
import periodRoutes from './routes/period.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/routine', routineRoutes);
app.use('/api/fitness', fitnessRoutes);
app.use('/api/mood', moodRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/period', periodRoutes);

// Serve static assets in production (any environment other than development)
if (process.env.NODE_ENV !== 'development') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
  
  // Any non-API route should serve index.html
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../frontend', 'dist', 'index.html'));
  });
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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

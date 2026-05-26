# GROWTH: Routine, Fitness & Self-Development Tracker

GROWTH is a premium, state-of-the-art, dark-themed habit and wellness tracking application. Built with a clean glassmorphism aesthetic and a viewport-constrained responsive layout, the platform integrates daily routine execution, fitness indicators, menstrual cycle predictions, cognitive reflection history, and AI coaching insights powered by Google Gemini.

---

## Key Features

### 📅 Daily Routine & Time-Bounded Habits
- **Time-Bounded Schedules**: Assign due times to tasks. Time-bounded items display a clean schedule badge with a Clock vector icon.
- **Customizable Routines**: Toggle and separate mandatory core habits (e.g., workout, study) from custom daily tasks.
- **Progress Tracking**: View live task compliance percentages and fill status rings.

### 🎯 Ultimate Goals Milestone
- **Milestone Countdown**: Declare an ultimate target (e.g. running a marathon, learning to code) in Settings and track remaining days directly on the dashboard.
- **Gemini AI Coaching Evaluation**: The AI coach reads compliance history and assesses whether your current work rate is sufficient to meet your ultimate goal.

### 😴 Advanced Sleep Scoring
- **Efficiency Metric**: Input Sleep/Wake times, sleep latency (minutes to fall asleep), restlessness, and wake-up energy level.
- **Sleep Score (0-100)**: Backend algorithm computes a sleep efficiency rating, visible as a dynamic badge and tracked in Analytics history.

### 🧠 Mindset & Self-Development
- **Daily Reflection Journaling**: Record mindset scores and log gratitude entries.
- **Pomodoro Focus Timer**: Toggle between 25-minute focus intervals and 5-minute short breaks.
- **Routine Streaks Visualizer**: Track consecutive days completing mandatory routines over the past 7 days.
- **Motivation Corner**: Embedded grid of responsive, curated discipline speeches and ambient lofi study tracks.

### 💧 Fitness & Health Tracker
- **Hydration Logging**: Track water intake against a 2000ml goal with a fluid progress indicator.
- **Weight Trajectory**: Log body weight, calculate BMI categories, and view history tables.
- **Menstrual Cycle Predictor**: Conditionally rendered for female users. Track cycle history, log symptoms (cramps, energy), and project the next cycle start date with a countdown warning.

### 📊 Performance Analytics & AI Insights
- **Compliance Charts**: Dynamic compliance bar charts, weight trajectory graphs, and sleep score graphs (Chart.js).
- **AI Coach Insights**: Generates automated actionable diagnostics and fetches generative summary coaching reports.

---

## Technology Stack

- **Frontend**: React 19, Vite, ChartJS, Lucide React (vector icons, no emojis).
- **Backend**: Node.js, Express, Cors, Dotenv, local file JSON DB database (100% reliable local SQLite-equivalent with zero environment compilation failures).
- **AI Integration**: Google Gemini API SDK.

---

## Local Development & Setup

### 1. Backend Server Configuration
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up the environment file:
   Create a `.env` file in `/backend` with the following:
   ```env
   PORT=5050
   GEMINI_API_KEY=your_gemini_key_here
   JWT_SECRET=your_jwt_secret_token
   ```
4. Start the backend:
   ```bash
   npm start
   ```

### 2. Frontend Development Server
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```

---

## 📱 Mobile Responsiveness & Phone Testing
GROWTH is built with a dynamic, mobile-first responsive layout to prevent screen freezing:
- **Desktop/Tablet Layout**: Displays as a viewport-locked layout with sidebar navigation, side-by-side columns, and inner scrolls to fit standard monitors.
- **Mobile Device Layout (<= 768px)**: 
  - Hides the sidebar and automatically renders a **Bottom Navigation Bar** at the bottom of the screen with quick-action icon controls.
  - Automatically folds columns into a single vertical scroll stream so that no items are hidden below the fold.
  - Placed a Logout button on the right side of the sticky top header for quick sign-out access.

### Accessing the Web App from a Mobile Phone:
1. Ensure both your computer and phone are connected to the same local Wi-Fi router.
2. Run Vite bound to all hosts on the computer:
   ```bash
   npx vite --host 0.0.0.0
   ```
3. Look for the `Network` URL in the output (e.g. `http://192.168.x.x:5173/`).
4. Enter this URL into your phone's browser. The application will dynamically route API connections to the backend IP on the local network automatically.

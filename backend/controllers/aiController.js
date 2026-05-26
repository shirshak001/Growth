import { db } from '../config/db.js';

// Local Analytics Engine (Smart Heuristic Coach)
const generateLocalSuggestions = (data) => {
  const { sleepLogs, tasks, fitnessLogs, moodLogs, profile } = data;
  const suggestions = [];

  // 1. Sleep Analysis
  if (sleepLogs.length > 0) {
    const lastLogs = sleepLogs.slice(0, 7); // Last 7 sleep logs
    const avgSleep = lastLogs.reduce((acc, log) => acc + log.duration, 0) / lastLogs.length;
    const avgQuality = lastLogs.reduce((acc, log) => acc + log.quality, 0) / lastLogs.length;

    if (avgSleep < 7) {
      suggestions.push({
        category: 'sleep',
        title: 'Increase Sleep Duration',
        description: `Your average sleep duration is ${avgSleep.toFixed(1)}h, which is below the recommended 7-8 hours. Consistent sleep improves focus and cognitive performance. Try moving your sleep time earlier by 15-30 minutes.`,
        priority: 'high'
      });
    } else if (avgSleep > 9) {
      suggestions.push({
        category: 'sleep',
        title: 'Optimize Wake Time',
        description: `Your average sleep duration is ${avgSleep.toFixed(1)}h. Sleeping over 9 hours consistently can sometimes trigger sluggishness. Monitor your wake patterns to find your optimal circadian rhythm.`,
        priority: 'medium'
      });
    }

    if (avgQuality < 3) {
      suggestions.push({
        category: 'sleep',
        title: 'Enhance Sleep Quality',
        description: `Your sleep quality rating averages ${avgQuality.toFixed(1)}/5. Try implementing a wind-down routine 1 hour before bed (no blue light/screens, reduce caffeine intake in the afternoon, keep room cool).`,
        priority: 'high'
      });
    }
  } else {
    suggestions.push({
      category: 'sleep',
      title: 'Begin Sleep Tracking',
      description: 'Start logging your sleep hours daily. Consistency in wake/sleep cycles is the baseline of long-term energy and growth.',
      priority: 'medium'
    });
  }

  // 2. Task Completion & Habits Analysis
  if (tasks.length > 0) {
    // Let's count completion in last 7 days
    const today = new Date();
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      return d.toISOString().split('T')[0];
    });

    let totalPossible = 0;
    let completedCount = 0;
    let mandatoryCompleted = 0;
    let mandatoryTotal = 0;

    tasks.forEach(task => {
      // Calculate how many times it was completed in the last 7 days
      const completions = task.completedDates || [];
      const completionsLast7 = completions.filter(d => last7Days.includes(d)).length;

      completedCount += completionsLast7;
      totalPossible += 7; // assuming task is daily

      if (task.isMandatory) {
        mandatoryCompleted += completionsLast7;
        mandatoryTotal += 7;
      }
    });

    const completionRate = totalPossible > 0 ? (completedCount / totalPossible) * 100 : 0;
    const mandatoryRate = mandatoryTotal > 0 ? (mandatoryCompleted / mandatoryTotal) * 100 : 0;

    if (completionRate < 40 && totalPossible > 0) {
      suggestions.push({
        category: 'productivity',
        title: 'Reduce Task Load',
        description: `Your overall task completion rate is ${completionRate.toFixed(0)}% this week. When streaks are low, it is best to focus on just 1 or 2 essential items. Master your mandatory tasks before adding custom ones.`,
        priority: 'high'
      });
    } else if (completionRate > 80 && totalPossible > 0) {
      suggestions.push({
        category: 'productivity',
        title: 'Sustain Momentum',
        description: `Incredible execution! You completed ${completionRate.toFixed(0)}% of your tasks this week. Keep tracking and consider increasing the difficulty of your study or practice sessions.`,
        priority: 'medium'
      });
    }

    // Check mandatory tasks
    if (mandatoryRate < 60 && mandatoryTotal > 0) {
      const incompleteMandatory = tasks.filter(t => t.isMandatory).map(t => t.title).join(', ');
      suggestions.push({
        category: 'productivity',
        title: 'Prioritize Mandatory Routines',
        description: `Your mandatory routines (like ${incompleteMandatory}) are sitting at a ${mandatoryRate.toFixed(0)}% completion rate. Schedule these first thing in the morning to prevent daily decision fatigue.`,
        priority: 'high'
      });
    }
  }

  // 3. Fitness & Weight Analysis
  if (fitnessLogs.length > 0 && profile) {
    const validWeights = fitnessLogs.filter(log => log.weight !== null).slice(0, 10);
    
    if (validWeights.length >= 2) {
      const latestWeight = validWeights[0].weight;
      const olderWeight = validWeights[validWeights.length - 1].weight;
      const weightDiff = latestWeight - olderWeight;
      const targetWeight = profile.targetWeight || 70;

      if (Math.abs(latestWeight - targetWeight) < 1) {
        suggestions.push({
          category: 'fitness',
          title: 'Target Weight Reached',
          description: `Excellent work! Your current weight of ${latestWeight}kg is aligned with your target (${targetWeight}kg). Transition your focus to weight maintenance, body recomposition, and strength.`,
          priority: 'medium'
        });
      } else if (latestWeight > targetWeight && weightDiff > 0.5) {
        suggestions.push({
          category: 'fitness',
          title: 'Caloric Control and Consistency',
          description: `Your weight increased by ${weightDiff.toFixed(1)}kg recently. To reach your target of ${targetWeight}kg, increase daily active minutes and focus on whole foods. Log your water intake to regulate metabolism.`,
          priority: 'medium'
        });
      } else if (latestWeight < targetWeight && weightDiff < -0.5) {
        suggestions.push({
          category: 'fitness',
          title: 'Nutrient Density Increase',
          description: `Your weight decreased by ${Math.abs(weightDiff).toFixed(1)}kg. To reach your target of ${targetWeight}kg, increase clean protein and carb portions. Focus on progressive overload in resistance training.`,
          priority: 'medium'
        });
      }
    }

    // Water intake tracking
    const recentWaterLogs = fitnessLogs.slice(0, 3);
    const avgWater = recentWaterLogs.reduce((acc, log) => acc + (log.waterIntake || 0), 0) / (recentWaterLogs.length || 1);
    if (avgWater < 1500 && recentWaterLogs.length > 0) {
      suggestions.push({
        category: 'fitness',
        title: 'Hydration Target',
        description: `Your average recent water intake is ${avgWater.toFixed(0)}ml, which is below the optimal 2000-2500ml range. Dehydration impacts mood, energy, and muscle recovery. Keep a flask on your desk.`,
        priority: 'high'
      });
    }
  }

  // 4. Mood & Reflections Analysis (Self-Development)
  if (moodLogs.length > 0) {
    const recentMoods = moodLogs.slice(0, 5);
    const avgMood = recentMoods.reduce((acc, log) => acc + log.mood, 0) / recentMoods.length;

    if (avgMood < 3.2) {
      suggestions.push({
        category: 'mindset',
        title: 'Mindfulness & Decompression',
        description: `Your mood index is averaging ${avgMood.toFixed(1)}/5. Consider taking a 1-day reflection break, practicing a 10-minute breathwork routine, or detailing your feelings in the journal logs to declutter your mind.`,
        priority: 'high'
      });
    } else if (avgMood >= 4.2) {
      suggestions.push({
        category: 'mindset',
        title: 'Gratitude Accumulation',
        description: `Your mood is highly positive (averaging ${avgMood.toFixed(1)}/5)! Utilize this mental surplus to tackle challenging tasks, read books, or work on high-value self-development projects.`,
        priority: 'medium'
      });
    }
  }

  // Fallback defaults if list is too small
  if (suggestions.length === 0) {
    suggestions.push({
      category: 'general',
      title: 'Build Daily Consistency',
      description: 'You are on the right path. Complete your tasks, log your weight and sleep, and verify your progress on the charts page. Growth is built on daily compound actions.',
      priority: 'medium'
    });
  }

  return suggestions;
};

// @desc    Get AI suggestions (Local heuristics or Gemini if Key exists)
// @route   POST /api/ai/suggestions
// @access  Private
export const getAISuggestions = async (req, res) => {
  const userId = req.userId;

  // Retrieve all databases
  const user = db.findOne('users', u => u.id === userId);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const sleepLogs = db.find('sleepLogs', log => log.userId === userId).sort((a, b) => b.date.localeCompare(a.date));
  const tasks = db.find('tasks', t => t.userId === userId && t.isActive !== false);
  const fitnessLogs = db.find('fitnessLogs', log => log.userId === userId).sort((a, b) => b.date.localeCompare(a.date));
  const moodLogs = db.find('moodLogs', log => log.userId === userId).sort((a, b) => b.date.localeCompare(a.date));

  const profile = {
    height: user.height,
    targetWeight: user.targetWeight
  };

  const payload = { sleepLogs, tasks, fitnessLogs, moodLogs, profile };
  
  // Get local base recommendations
  const localSuggestions = generateLocalSuggestions(payload);

  // Fallback to process.env.GEMINI_API_KEY if user has not specified one
  const apiKey = user.geminiApiKey || process.env.GEMINI_API_KEY;
  let geminiAdvice = '';
  
  if (apiKey) {
    try {
      const sleepSummary = sleepLogs.slice(0, 5).map(l => 
        `${l.date}: Slept ${l.duration}h, Quality: ${l.quality}/5, Latency: ${l.sleepLatency || 15}m, Energy: ${l.wakeEnergy || 3}/5, Score: ${l.sleepScore || 'N/A'}/100`
      ).join('\n');
      
      const taskSummary = tasks.map(t => 
        `${t.title} (${t.category}${t.dueTime ? `, Due: ${t.dueTime}` : ''}): Done ${t.completedDates?.length || 0} times`
      ).join('\n');
      
      const fitnessSummary = fitnessLogs.slice(0, 5).map(l => 
        `${l.date}: Weight ${l.weight || 'N/A'}kg, Water ${l.waterIntake || 0}ml`
      ).join('\n');
      
      const moodSummary = moodLogs.slice(0, 5).map(l => 
        `${l.date}: Mood ${l.mood}/5, Notes: ${l.reflection || 'None'}`
      ).join('\n');

      const goal = user.ultimateGoal || { title: 'Not Set', description: 'None', targetDate: 'N/A' };

      const prompt = `You are a premium, highly scientific AI Life Coach. Analyze this user's data and provide a concise, direct, clinical and motivational summary (max 200 words).
Evaluate the user's progress toward their Ultimate Goal:
Goal Title: "${goal.title}"
Goal Description: "${goal.description}"
Goal Target Date: ${goal.targetDate}

Analyze their recent habits, daily task completions, sleep quality/scores, and fitness logs.
Provide a clear analysis on whether they are "doing well" or "need to work harder". Give specific, actionable adjustments. Do not use emojis, keep the tone minimalist and professional.

User Stats: Height ${user.height}cm, Target Weight ${user.targetWeight}kg.
Recent Sleep History:
${sleepSummary || 'No data'}
Recent Task Lists:
${taskSummary || 'No data'}
Recent Fitness History:
${fitnessSummary || 'No data'}
Recent Mood Logs:
${moodSummary || 'No data'}`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        }
      );

      if (response.ok) {
        const result = await response.json();
        geminiAdvice = result?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      } else {
        console.error('Gemini API call failed with status:', response.status);
        geminiAdvice = 'Gemini API connection error. Check configuration.';
      }
    } catch (error) {
      console.error('Error invoking Gemini:', error);
      geminiAdvice = 'Unable to connect to Gemini API. Utilizing offline heuristics.';
    }
  }

  res.status(200).json({
    localSuggestions,
    geminiAdvice
  });
};

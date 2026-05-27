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
  const dopamineLogs = db.find('dopamineLogs', log => log.userId === userId).sort((a, b) => b.date.localeCompare(a.date));
  const transactions = db.find('transactions', t => t.userId === userId).sort((a, b) => b.date.localeCompare(a.date));

  const profile = {
    height: user.height,
    targetWeight: user.targetWeight
  };

  const payload = { sleepLogs, tasks, fitnessLogs, moodLogs, profile };
  
  // Get local base recommendations
  const localSuggestions = generateLocalSuggestions(payload);

  // Financial Stats & Suggestions
  let totalIncome = 0;
  let totalExpenses = 0;
  transactions.forEach(t => {
    if (t.type === 'income') totalIncome += Number(t.amount);
    else if (t.type === 'expense') totalExpenses += Number(t.amount);
  });
  const netSavings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;

  if (totalExpenses > totalIncome && totalIncome > 0) {
    localSuggestions.push({
      category: 'finance',
      title: 'Expense Exceeds Income',
      description: `Your expenses (₹${totalExpenses}) exceed your income (₹${totalIncome}). Audit your recent transactions to cut non-essential costs.`,
      priority: 'high'
    });
  } else if (totalIncome > 0 && savingsRate < 20) {
    localSuggestions.push({
      category: 'finance',
      title: 'Increase Savings Rate',
      description: `Your savings rate is ${savingsRate}%. Aim to save at least 20% of your total income by optimizing discretionary spending.`,
      priority: 'medium'
    });
  } else if (transactions.length === 0) {
    localSuggestions.push({
      category: 'finance',
      title: 'Begin Financial Tracking',
      description: 'Start logging your daily income and expenses. Keeping a close tab on your finances builds long-term life discipline.',
      priority: 'medium'
    });
  }

  // Fallback to process.env.GEMINI_API_KEY if user has not specified one
  const apiKey = user.geminiApiKey || process.env.GEMINI_API_KEY;
  let geminiAdvice = '';
  
  // Resolve today's date string
  const todayStr = new Date().toISOString().split('T')[0];
  const todaySleepLog = sleepLogs.find(l => l.date === todayStr);
  const todayFitnessLog = fitnessLogs.find(l => l.date === todayStr);
  const todayMoodLog = moodLogs.find(l => l.date === todayStr);
  const todayDopamineLog = dopamineLogs.find(l => l.date === todayStr);

  // 1. Calculate Life Score
  let totalWeight = 0;
  let weightedScoreSum = 0;

  if (todaySleepLog) {
    const sleepScore = todaySleepLog.sleepScore !== undefined ? todaySleepLog.sleepScore : todaySleepLog.quality * 20;
    weightedScoreSum += sleepScore * 0.20;
    totalWeight += 0.20;
  }

  if (tasks.length > 0) {
    const completedToday = tasks.filter(t => t.completedDates?.includes(todayStr)).length;
    const taskScore = (completedToday / tasks.length) * 100;
    weightedScoreSum += taskScore * 0.35;
    totalWeight += 0.35;
  }

  if (todayFitnessLog && todayFitnessLog.waterIntake !== undefined && todayFitnessLog.waterIntake !== null) {
    const waterScore = Math.min(100, (todayFitnessLog.waterIntake / 2000) * 100);
    weightedScoreSum += waterScore * 0.15;
    totalWeight += 0.15;
  }

  if (todayDopamineLog) {
    const dopamineScore = todayDopamineLog.dopamineScore !== undefined ? todayDopamineLog.dopamineScore : 100;
    weightedScoreSum += dopamineScore * 0.20;
    totalWeight += 0.20;
  }

  if (todayMoodLog) {
    const moodScore = todayMoodLog.mood * 20;
    weightedScoreSum += moodScore * 0.10;
    totalWeight += 0.10;
  }

  const lifeScore = totalWeight > 0 ? Math.round(weightedScoreSum / totalWeight) : 0;

  // 2. Calculate Burnout Probability
  let burnoutProb = 0;
  let hasBurnoutData = false;

  if (sleepLogs.length > 0) {
    hasBurnoutData = true;
    const avgSleepRecent = sleepLogs.slice(0, 3).reduce((acc, l) => acc + l.duration, 0) / Math.min(3, sleepLogs.length);
    if (avgSleepRecent < 6) burnoutProb += 25;
    else if (avgSleepRecent < 7) burnoutProb += 10;
  }
  if (tasks.length > 0) {
    hasBurnoutData = true;
    const totalPossibleCompletions = tasks.length * 7;
    let recentCompletions = 0;
    const today = new Date();
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      return d.toISOString().split('T')[0];
    });
    tasks.forEach(t => {
      recentCompletions += (t.completedDates || []).filter(d => last7Days.includes(d)).length;
    });
    const recentRate = totalPossibleCompletions > 0 ? (recentCompletions / totalPossibleCompletions) * 100 : 100;
    if (recentRate < 35) burnoutProb += 20;
  }
  if (todayMoodLog) {
    hasBurnoutData = true;
    if (todayMoodLog.mood <= 2) burnoutProb += 20;
  } else if (moodLogs.length > 0) {
    hasBurnoutData = true;
    if (moodLogs[0].mood <= 2) burnoutProb += 15;
  }
  if (todaySleepLog) {
    hasBurnoutData = true;
    if (todaySleepLog.restlessness >= 4) burnoutProb += 15;
  }
  if (todayDopamineLog) {
    hasBurnoutData = true;
    if (todayDopamineLog.totalMinutes > 150) burnoutProb += 15;
  }

  if (hasBurnoutData) {
    burnoutProb = Math.min(99, Math.max(5, burnoutProb + 10));
  } else {
    burnoutProb = 0;
  }

  // 3. Dynamic Schedule suggestion (AI Life Operator)
  let lifeOperatorSuggestion = "";
  if (totalWeight > 0) {
    if (burnoutProb > 65) {
      lifeOperatorSuggestion = `High Burnout Risk detected (${burnoutProb}%). Workload reduced: Suggest lowering tomorrow's focus tasks by 30%, prioritizing mild revision, and locking in a 15-minute relaxation window.`;
    } else if (todaySleepLog && todaySleepLog.duration < 6) {
      lifeOperatorSuggestion = `Poor Sleep Logged (${todaySleepLog.duration}h). Workload adjusted: focus blocks shifted later, active physical tasks reduced by 20%, and light study recommended to avoid cognitive overload.`;
    } else if (todayDopamineLog && todayDopamineLog.dopamineScore < 50) {
      lifeOperatorSuggestion = `Elevated distraction spikes logged today. Focus blocks rescheduled: Recommend activating Grayscale Focus Mode, setting single-task milestones, and doing a 10-minute digital detox.`;
    } else if (tasks.length > 0 && (tasks.filter(t => t.completedDates?.includes(todayStr)).length / tasks.length) > 0.8) {
      lifeOperatorSuggestion = "Peak Execution State! Momentum is high. Suggest scheduling focus blocks for your most complex subjects first thing tomorrow morning.";
    } else {
      lifeOperatorSuggestion = "Daily routine balanced. Maintain standard workloads and focus blocks tomorrow.";
    }
  }

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

      const transactionSummary = transactions.slice(0, 10).map(t =>
        `${t.date}: ${t.type.toUpperCase()} - ${t.category} (₹${t.amount}) ${t.description ? `- ${t.description}` : ''}`
      ).join('\n');

      const goal = user.ultimateGoal || { title: 'Not Set', description: 'None', targetDate: 'N/A' };

      const prompt = `You are a premium, highly scientific AI Life Coach. Analyze this user's data and provide a concise, direct, clinical and motivational summary (max 200 words).
Evaluate the user's progress toward their Ultimate Goal:
Goal Title: "${goal.title}"
Goal Description: "${goal.description}"
Goal Target Date: ${goal.targetDate}

Analyze their overall productivity: their recent habits, daily task completions, sleep quality/scores, mood, fitness logs, and financial transactions.
Evaluate their financial health: total income (₹${totalIncome}), total expenses (₹${totalExpenses}), net savings (₹${netSavings}), and savings rate (${savingsRate}%).
Provide a holistic evaluation of their discipline, focus, and productivity. Analyze if they are "doing well" or "need to work harder", and give specific, actionable adjustments. Do not use emojis, keep the tone minimalist, professional, and elite.

User Stats: Height ${user.height}cm, Target Weight ${user.targetWeight}kg.
Recent Sleep History:
${sleepSummary || 'No data'}
Recent Task Lists:
${taskSummary || 'No data'}
Recent Fitness History:
${fitnessSummary || 'No data'}
Recent Mood Logs:
${moodSummary || 'No data'}
Recent Financial Transactions:
${transactionSummary || 'No data'}`;

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
    geminiAdvice,
    lifeScore,
    burnoutProb,
    lifeOperatorSuggestion
  });
};

export const breakTaskWithAI = async (req, res) => {
  const { title } = req.body;
  const userId = req.userId;

  if (!title) {
    return res.status(400).json({ message: 'Task title is required' });
  }

  const user = db.findOne('users', u => u.id === userId);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const apiKey = user.geminiApiKey || process.env.GEMINI_API_KEY;
  let microStep = '';

  if (apiKey) {
    try {
      const prompt = `You are a psychological productivity and anti-procrastination coach. The user wants to work on this task but is procrastinating: "${title}".
Suggest exactly ONE ultra-simple, low-activation-energy micro-action that takes less than 3 minutes to start, designed to bypass mental resistance.
For example, instead of "Study Physics" suggest "Open Chapter 3 and solve only 2 numericals." or instead of "Clean Room" suggest "Pick up exactly 3 items from the floor."
Keep the suggestion to a single brief sentence of maximum 20 words. Do not use emojis, keep the tone minimalist and direct.`;

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
        microStep = result?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        microStep = microStep.trim();
      } else {
        microStep = `Open your notes and read the first paragraph of: ${title}`;
      }
    } catch (e) {
      console.error('Error invoking Gemini for task break:', e);
      microStep = `Just open: ${title} and work on it for 2 minutes only.`;
    }
  } else {
    microStep = `Just open: ${title} and spend exactly 2 minutes on the first step.`;
  }

  res.status(200).json({ microStep });
};

export const generateStudyRoadmap = async (req, res) => {
  const { targetExam, examDate, weakSubjects, availableHours } = req.body;
  const userId = req.userId;

  const user = db.findOne('users', u => u.id === userId);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const apiKey = user.geminiApiKey || process.env.GEMINI_API_KEY || 'AIzaSyBFMI3frSYOwOAGZd75FqV25j_oWPuf9p0';
  let generatedRoadmap = '';

  if (apiKey) {
    try {
      const prompt = `You are a world-class AI Study Strategist and Exam Performance Consultant.
The student is preparing for: "${targetExam}"
Target Exam Date: ${examDate || 'Not specified'}
Weak Subjects/Topics: "${weakSubjects || 'All general topics'}"
Available Daily Study Hours: ${availableHours} hours

Generate an advanced, highly realistic, milestone-based adaptive roadmap, weak-subject spacing loops, and burnout prevention tips.
Provide structured layout blocks (e.g. Phase 1, Phase 2, Revision loops). Limit to 250 words. Do not use emojis, keep the tone minimalist, clinical, and elite.`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        }
      );

      if (response.ok) {
        const result = await response.json();
        generatedRoadmap = result?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      } else {
        console.error('Gemini API call failed for study strategist:', response.status);
      }
    } catch (error) {
      console.error('Error invoking Gemini for study strategist:', error);
    }
  }

  if (!generatedRoadmap) {
    // Heuristic fallback
    generatedRoadmap = `[Adaptive Local Roadmap: ${targetExam}]\n\n` +
      `• PHASE 1 (Core Focus): Dedicate 60% of your daily ${availableHours}h block to [${weakSubjects || 'weak topics'}] revision.\n` +
      `• PHASE 2 (Spaced Recall): Solve mock tests every 3 days. Dedicate 2 hours to active diagnostic corrections.\n` +
      `• RECOVERY: Take a 15-minute screen-free walk after every 90-minute focus study block to avoid early burnout.`;
  }

  // Save to db
  const existingPlan = db.findOne('studyPlans', plan => plan.userId === userId);

  let result;
  if (existingPlan) {
    db.update('studyPlans', plan => plan.id === existingPlan.id, {
      targetExam,
      examDate,
      weakSubjects,
      availableHours: Number(availableHours || 4),
      aiRoadmap: generatedRoadmap
    });
    result = db.findOne('studyPlans', plan => plan.id === existingPlan.id);
  } else {
    result = db.insert('studyPlans', {
      userId,
      targetExam,
      examDate,
      weakSubjects,
      availableHours: Number(availableHours || 4),
      aiRoadmap: generatedRoadmap
    });
  }

  res.status(200).json(result);
};

export const getAICompanionResponse = async (req, res) => {
  const { message, context } = req.body;
  const userId = req.userId;

  const user = db.findOne('users', u => u.id === userId);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const apiKey = user.geminiApiKey || process.env.GEMINI_API_KEY || 'AIzaSyBFMI3frSYOwOAGZd75FqV25j_oWPuf9p0';
  let replyText = '';

  if (apiKey) {
    try {
      const prompt = `You are Aria, a premium supportive AI Companion inside the Growth tracking application. 
Your goal is to help the student build discipline, consistency, and exam readiness.
Current User Context: ${context || 'No logs loaded yet.'}

Instructions:
1. Provide clinical, supportive, and elite motivational responses.
2. Keep it brief (under 80 words).
3. Do NOT use emojis.
4. Do NOT say you are an AI assistant; you are Aria, their growth companion.

User message: "${message}"`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        }
      );

      if (response.ok) {
        const result = await response.json();
        replyText = result?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      } else {
        console.error('Gemini API call failed for companion:', response.status);
      }
    } catch (e) {
      console.error('Error invoking Gemini for companion:', e);
    }
  }

  if (!replyText) {
    replyText = 'I am here. Let us stay aligned with our study strategizer roadmap.';
  }

  res.status(200).json({ replyText: replyText.trim() });
};

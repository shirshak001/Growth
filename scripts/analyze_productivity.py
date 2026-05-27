#!/usr/bin/env python3
"""
Life OS Productivity Analytics & Predictive Engine
Author: Antigravity AI
Date: 2026-05-27
Description: Parses local JSON log databases to analyze habits, calculate metric correlations, 
             run machine learning forecasts for upcoming productivity, and generate visual plots.
"""

import os
import sys
import json
import argparse
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from sklearn.linear_model import LinearRegression

# ANSI color codes for premium CLI styling
class colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'
    ENDC = '\033[0m'

def load_json(filepath):
    """Safely loads a JSON file, returning an empty list if not found or malformed."""
    if not os.path.exists(filepath):
        return []
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read().strip()
            return json.loads(content) if content else []
    except Exception as e:
        print(f"{colors.RED}Warning: Error reading {filepath}: {e}{colors.ENDC}")
        return []

def save_json(filepath, data):
    """Safely saves data to a JSON file."""
    try:
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2)
        return True
    except Exception as e:
        print(f"{colors.RED}Error saving {filepath}: {e}{colors.ENDC}")
        return False

def generate_mock_history(data_dir, user_id):
    """Generates realistic 30-day historical data for demonstration and testing."""
    print(f"{colors.CYAN}Generating 30 days of realistic mock logs for User: {user_id}...{colors.ENDC}")
    today = datetime.now()
    
    # 1. Sleep logs
    sleep_logs = []
    # 2. Mood logs
    mood_logs = []
    # 3. Dopamine logs
    dopamine_logs = []
    # 4. Fitness logs
    fitness_logs = []
    
    # Generate daily logs with realistic correlations
    # E.g. Sleep duration affects mood, scrolling mins affect productivity and mood.
    np.random.seed(42)  # For reproducible mock data
    
    for i in range(30, -1, -1):
        date_str = (today - timedelta(days=i)).strftime("%Y-%m-%d")
        
        # Determine latent sleep variable (average 7.2 hours, standard dev 1.1)
        sleep_duration = float(np.clip(np.random.normal(7.2, 1.1), 4.5, 9.5))
        # Sleep quality correlates with sleep duration
        sleep_quality = int(np.clip(np.round(sleep_duration - 4 + np.random.normal(1.0, 0.6)), 1, 5))
        sleep_score = int(np.clip(sleep_duration * 10 + sleep_quality * 5, 30, 100))
        
        sleep_logs.append({
            "userId": user_id,
            "date": date_str,
            "sleepTime": "23:00",
            "wakeTime": f"0{int(sleep_duration)}:00",
            "duration": round(sleep_duration, 1),
            "quality": sleep_quality,
            "sleepScore": sleep_score,
            "id": f"mock-sleep-{date_str}"
        })
        
        # Dopamine/screentime: high scrolling reduces productivity/sleep
        scrolling = int(np.clip(np.random.normal(60, 40) + (10 - sleep_duration)*10, 15, 240))
        youtube = int(np.clip(np.random.normal(45, 25), 10, 150))
        instagram = int(np.clip(np.random.normal(30, 20), 5, 120))
        total_mins = scrolling + youtube + instagram
        dop_score = max(10, min(100, round(100 - (total_mins / 3))))
        
        dopamine_logs.append({
            "userId": user_id,
            "date": date_str,
            "instagramMins": instagram,
            "youtubeMins": youtube,
            "scrollingMins": scrolling,
            "totalMinutes": total_mins,
            "dopamineScore": dop_score,
            "id": f"mock-dopamine-{date_str}"
        })
        
        # Mood correlates positively with sleep, negatively with screentime
        mood_val = int(np.clip(np.round(2.5 + 0.3*(sleep_duration-6) - 0.005*(scrolling-60) + np.random.normal(0, 0.5)), 1, 5))
        mood_logs.append({
            "userId": user_id,
            "date": date_str,
            "mood": mood_val,
            "reflection": "Mock entry representing balanced productivity day." if mood_val >= 3 else "Felt sluggish and distracted.",
            "id": f"mock-mood-{date_str}"
        })
        
        # Fitness/Water: baseline water 1500ml
        water = int(np.clip(np.random.normal(1800, 500), 800, 3000))
        fitness_logs.append({
            "userId": user_id,
            "date": date_str,
            "waterIntake": water,
            "weight": 72.0 + round(np.random.normal(0, 0.1), 1),
            "id": f"mock-fit-{date_str}"
        })
    
    # 5. Create some default tasks if not present, and mark completion dates
    tasks = load_json(os.path.join(data_dir, "tasks.json"))
    
    # Let's keep existing tasks but add completions across dates for this user
    mock_task_templates = [
        {"title": "Study Algorithm Designs", "category": "study", "isMandatory": True},
        {"title": "Complete 30 Mins Workout", "category": "workout", "isMandatory": False},
        {"title": "Read Academic Paper", "category": "study", "isMandatory": False},
        {"title": "Daily Habit: Hydrate 2L", "category": "custom", "isMandatory": True},
        {"title": "Core Programming Revision", "category": "study", "isMandatory": True}
    ]
    
    user_tasks = [t for t in tasks if t.get("userId") == user_id]
    if len(user_tasks) < 3:
        # Create mock tasks
        for template in mock_task_templates:
            new_task = {
                "userId": user_id,
                "title": template["title"],
                "isMandatory": template["isMandatory"],
                "category": template["category"],
                "completedDates": [],
                "isActive": True,
                "createdAt": (today - timedelta(days=35)).isoformat() + "Z",
                "id": f"mock-task-{int(np.random.rand()*1000000)}"
            }
            # Fill completed dates based on high probability if sleep was good
            for i in range(30, -1, -1):
                date_str = (today - timedelta(days=i)).strftime("%Y-%m-%d")
                # Completion rate depends on sleep and screen time
                sleep_factor = (sleep_logs[30-i]["duration"] - 5) / 4 # positive
                scroll_factor = (120 - dopamine_logs[30-i]["scrollingMins"]) / 120 # positive if screen time is low
                prob = 0.5 + 0.2*sleep_factor + 0.2*scroll_factor
                if np.random.rand() < prob:
                    new_task["completedDates"].append(date_str)
            tasks.append(new_task)
            
    # Save files back
    save_json(os.path.join(data_dir, "sleepLogs.json"), sleep_logs)
    save_json(os.path.join(data_dir, "moodLogs.json"), mood_logs)
    save_json(os.path.join(data_dir, "dopamineLogs.json"), dopamine_logs)
    save_json(os.path.join(data_dir, "fitnessLogs.json"), fitness_logs)
    save_json(os.path.join(data_dir, "tasks.json"), tasks)
    
    print(f"{colors.GREEN}Mock data successfully written! You can now perform full data analysis.{colors.ENDC}\n")

def run_analysis(data_dir, user_id, limit_days, output_dir):
    """Loads, preprocesses, models, and visualizes user productivity logs."""
    # 1. Load Data files
    users = load_json(os.path.join(data_dir, "users.json"))
    sleep_logs = load_json(os.path.join(data_dir, "sleepLogs.json"))
    mood_logs = load_json(os.path.join(data_dir, "moodLogs.json"))
    dopamine_logs = load_json(os.path.join(data_dir, "dopamineLogs.json"))
    fitness_logs = load_json(os.path.join(data_dir, "fitnessLogs.json"))
    tasks = load_json(os.path.join(data_dir, "tasks.json"))
    
    # 2. Select User
    selected_user = None
    for u in users:
        if u.get("id") == user_id:
            selected_user = u
            break
            
    if not selected_user and users:
        # Fallback to the first user
        selected_user = users[0]
        user_id = selected_user.get("id")
        
    if not selected_user:
        print(f"{colors.RED}Error: No user profiles found in users.json.{colors.ENDC}")
        return False
        
    print(f"{colors.HEADER}{colors.BOLD}=====================================================================")
    print(f"               LIFE OS PRODUCTIVITY ANALYTICS SYSTEM                 ")
    print(f"====================================================================={colors.ENDC}")
    print(f"{colors.CYAN}User: {colors.BOLD}{selected_user.get('name')}{colors.ENDC} ({selected_user.get('email')})")
    print(f"{colors.CYAN}User ID: {user_id}{colors.ENDC}\n")
    
    # 3. Filter logs for the selected user
    user_sleep = [l for l in sleep_logs if l.get("userId") == user_id]
    user_mood = [l for l in mood_logs if l.get("userId") == user_id]
    user_dopamine = [l for l in dopamine_logs if l.get("userId") == user_id]
    user_fitness = [l for l in fitness_logs if l.get("userId") == user_id]
    user_tasks = [t for t in tasks if t.get("userId") == user_id]
    
    # Extract unique dates present across all logging structures
    all_dates = set()
    for l in user_sleep: all_dates.add(l.get("date"))
    for l in user_mood: all_dates.add(l.get("date"))
    for l in user_dopamine: all_dates.add(l.get("date"))
    for l in user_fitness: all_dates.add(l.get("date"))
    
    for t in user_tasks:
        for completed_date in t.get("completedDates", []):
            all_dates.add(completed_date)
            
    if not all_dates:
        print(f"{colors.YELLOW}Warning: No logs found for this user.{colors.ENDC}")
        print("Please log some telemetry in the web interface, or run this script with --generate-mock to generate test logs.")
        return False
        
    # Align logs by Date
    daily_records = []
    
    for date_str in sorted(all_dates):
        # 3.1 Sleep
        s_log = next((l for l in user_sleep if l.get("date") == date_str), None)
        sleep_dur = s_log.get("duration") if s_log else None
        sleep_qual = s_log.get("quality") if s_log else None
        sleep_sc = s_log.get("sleepScore") if s_log else None
        if sleep_sc is None and sleep_qual is not None:
            sleep_sc = sleep_qual * 20
            
        # 3.2 Mood
        m_log = next((l for l in user_mood if l.get("date") == date_str), None)
        mood_val = m_log.get("mood") if m_log else None
        
        # 3.3 Dopamine
        d_log = next((l for l in user_dopamine if l.get("date") == date_str), None)
        scrolling_mins = d_log.get("scrollingMins") if d_log else None
        dop_score = d_log.get("dopamineScore") if d_log else None
        if dop_score is None and d_log:
            total_mins = d_log.get("totalMinutes", 0)
            dop_score = max(10, min(100, round(100 - (total_mins / 3))))
            
        # 3.4 Fitness / Water
        f_log = next((l for l in user_fitness if l.get("date") == date_str), None)
        water_ml = f_log.get("waterIntake") if f_log else None
        
        # 3.5 Tasks completion rate
        # Count tasks active on this date
        active_on_date = 0
        completed_on_date = 0
        
        for t in user_tasks:
            # Check creation date
            created_at = t.get("createdAt")
            created_date = created_at.split('T')[0] if created_at else None
            
            # Check if task existed by this date
            if not created_date or created_date <= date_str:
                active_on_date += 1
                if date_str in t.get("completedDates", []):
                    completed_on_date += 1
                    
        task_rate = (completed_on_date / active_on_date * 100) if active_on_date > 0 else None
        
        # Aggregate components to calculate "Productivity Score" (0-100)
        # Weights: Tasks (35%), Sleep (20%), Focus (20%), Mood (15%), Water (10%)
        weighted_score_sum = 0
        total_weight = 0
        
        if task_rate is not None:
            weighted_score_sum += task_rate * 0.35
            total_weight += 0.35
        if sleep_sc is not None:
            weighted_score_sum += sleep_sc * 0.20
            total_weight += 0.20
        if dop_score is not None:
            weighted_score_sum += dop_score * 0.20
            total_weight += 0.20
        if mood_val is not None:
            weighted_score_sum += (mood_val * 20) * 0.15
            total_weight += 0.15
        if water_ml is not None:
            water_sc = min(100, (water_ml / 2000) * 100)
            weighted_score_sum += water_sc * 0.10
            total_weight += 0.10
            
        prod_score = round(weighted_score_sum / total_weight) if total_weight > 0 else None
        
        daily_records.append({
            "date": date_str,
            "sleep_duration": sleep_dur,
            "sleep_quality": sleep_qual,
            "sleep_score": sleep_sc,
            "mood": mood_val,
            "scrolling_minutes": scrolling_mins,
            "dopamine_score": dop_score,
            "water_intake": water_ml,
            "tasks_active": active_on_date,
            "tasks_completed": completed_on_date,
            "task_completion_rate": task_rate,
            "productivity_score": prod_score
        })
        
    df = pd.DataFrame(daily_records)
    df['date'] = pd.to_datetime(df['date'])
    df = df.sort_values('date').reset_index(drop=True)
    
    # Handle limiting of days
    if limit_days:
        cutoff_date = datetime.now() - timedelta(days=limit_days)
        df = df[df['date'] >= cutoff_date].reset_index(drop=True)
        
    num_days = len(df)
    print(f"{colors.BLUE}Analyzing logs across the last {num_days} active days...{colors.ENDC}\n")
    
    # 4. Correlation Analysis
    # Drop rows with NaNs for correlation
    corr_cols = ['productivity_score', 'sleep_duration', 'sleep_quality', 'mood', 'dopamine_score', 'water_intake']
    df_clean = df[corr_cols].dropna()
    
    correlations = {}
    if len(df_clean) >= 3:
        corr_matrix = df_clean.corr()
        for col in corr_cols[1:]:
            correlations[col] = corr_matrix.loc['productivity_score', col]
            
    # Print Metrics Summary Table
    print(f"{colors.BOLD}METRIC SUMMARY TABLE (Averages):{colors.ENDC}")
    print(f"{'-'*75}")
    print(f"{'Metric':<25} | {'Average Value':<18} | {'Impact on Productivity (Corr)':<25}")
    print(f"{'-'*75}")
    
    avg_sleep = df['sleep_duration'].mean()
    avg_mood = df['mood'].mean()
    avg_dop = df['dopamine_score'].mean()
    avg_scroll = df['scrolling_minutes'].mean()
    avg_water = df['water_intake'].mean()
    avg_prod = df['productivity_score'].mean()
    
    metrics_list = [
        ('Productivity Score', f"{avg_prod:.1f}/100" if not pd.isna(avg_prod) else "N/A", "Target Variable"),
        ('Sleep Duration', f"{avg_sleep:.1f} hours" if not pd.isna(avg_sleep) else "N/A", f"{correlations.get('sleep_duration', 0.0):+.2f}" if 'sleep_duration' in correlations else "N/A"),
        ('Sleep Quality', f"{df['sleep_quality'].mean():.1f}/5" if not pd.isna(df['sleep_quality'].mean()) else "N/A", f"{correlations.get('sleep_quality', 0.0):+.2f}" if 'sleep_quality' in correlations else "N/A"),
        ('Mood Index', f"{avg_mood:.1f}/5" if not pd.isna(avg_mood) else "N/A", f"{correlations.get('mood', 0.0):+.2f}" if 'mood' in correlations else "N/A"),
        ('Dopamine Focus Score', f"{avg_dop:.1f}/100" if not pd.isna(avg_dop) else "N/A", f"{correlations.get('dopamine_score', 0.0):+.2f}" if 'dopamine_score' in correlations else "N/A"),
        ('Social Media Scrolling', f"{avg_scroll:.1f} mins" if not pd.isna(avg_scroll) else "N/A", "Correlated with Focus"),
        ('Water Intake', f"{avg_water:.0f} ml" if not pd.isna(avg_water) else "N/A", f"{correlations.get('water_intake', 0.0):+.2f}" if 'water_intake' in correlations else "N/A")
    ]
    
    for label, val, corr_str in metrics_list:
        if "N/A" not in val:
            color = colors.GREEN if (corr_str.startswith('+') and float(corr_str) > 0.2) else (colors.RED if (corr_str.startswith('-') or (corr_str.startswith('+') and float(corr_str) < -0.2)) else colors.ENDC)
            if label == 'Productivity Score' or corr_str == "Target Variable" or corr_str == "Correlated with Focus":
                color = colors.CYAN
            print(f"{label:<25} | {val:<18} | {color}{corr_str:<25}{colors.ENDC}")
            
    print(f"{'-'*75}\n")
    
    # 5. Productivity Prediction (Lag Model)
    # We want to use [sleep_duration, sleep_quality, mood, dopamine_score, water_intake, productivity_score] of Day T
    # to predict productivity_score of Day T+1
    prediction_result = None
    predictor_features = ['sleep_duration', 'sleep_quality', 'mood', 'dopamine_score', 'water_intake', 'productivity_score']
    
    # Build Lag dataset
    df_lag = df[predictor_features].copy()
    # Forward shift features so they line up with tomorrow's productivity
    df_lag['tomorrow_productivity'] = df_lag['productivity_score'].shift(-1)
    df_lag_clean = df_lag.dropna()
    
    model_trained = False
    
    if len(df_lag_clean) >= 5:
        X = df_lag_clean[predictor_features]
        y = df_lag_clean['tomorrow_productivity']
        
        model = LinearRegression()
        model.fit(X, y)
        model_trained = True
        
        # Predict tomorrow's score based on today's logged metrics
        today_record = df.iloc[-1]
        today_features = today_record[predictor_features].to_frame().T
        
        # Check if today has NaNs. If yes, fill with column average
        if today_features.isnull().values.any():
            for col in predictor_features:
                if pd.isna(today_features.loc[today_features.index[0], col]):
                    today_features.loc[today_features.index[0], col] = df[col].mean()
                    
        predicted_score = float(model.predict(today_features)[0])
        predicted_score = max(5, min(99, round(predicted_score)))
        
        # Calculate feature importances (coefficients)
        coefficients = {}
        for col, coef in zip(X.columns, model.coef_):
            coefficients[col] = coef
            
        prediction_result = {
            "method": "Linear Regression (Lag-1 Model)",
            "predicted_score": predicted_score,
            "coefficients": coefficients
        }
    else:
        # Fallback to exponential moving average of past productivity scores
        recent_scores = df['productivity_score'].dropna().tolist()
        if len(recent_scores) > 0:
            weights = np.exp(np.linspace(-1, 0, len(recent_scores)))
            weights /= weights.sum()
            predicted_score = round(np.dot(recent_scores, weights))
            predicted_score = max(5, min(99, predicted_score))
        else:
            predicted_score = 50
            
        prediction_result = {
            "method": f"Exponential Weighted Heuristic (Insufficient historical data: {len(df_lag_clean)}/5 lag pairs)",
            "predicted_score": predicted_score,
            "coefficients": {}
        }
        
    print(f"{colors.BOLD}TOMORROW'S PRODUCTIVITY FORECAST:{colors.ENDC}")
    print(f"Method: {prediction_result['method']}")
    color_score = colors.GREEN if predicted_score >= 75 else (colors.YELLOW if predicted_score >= 50 else colors.RED)
    print(f"Predicted Productivity Score for Tomorrow: {color_score}{colors.BOLD}{predicted_score}/100{colors.ENDC}")
    
    # 6. Recommendation Logic
    print(f"\n{colors.BOLD}PERSONALIZED SUGGESTIONS & INSIGHTS:{colors.ENDC}")
    suggestions = []
    
    # 6.1 Sleep advice
    if not pd.isna(avg_sleep):
        if avg_sleep < 7.0:
            coef_msg = ""
            if model_trained and prediction_result['coefficients'].get('sleep_duration', 0) > 0.5:
                coef_msg = f" (Increasing sleep by 1h is modeled to raise tomorrow's productivity by {prediction_result['coefficients']['sleep_duration']:.1f} points)"
            suggestions.append({
                "type": "Sleep Optimization",
                "text": f"Your average sleep duration is low ({avg_sleep:.1f} hours). Sleep deprivation acts as a massive bottleneck to cognitive bandwidth.{coef_msg} Action: Prioritize an 8-hour sleep block tonight by shutting down screens by 10:30 PM."
            })
            
    # 6.2 Dopamine/Screentime advice
    if not pd.isna(avg_scroll):
        if avg_scroll > 60:
            corr_msg = ""
            if 'dopamine_score' in correlations and correlations['dopamine_score'] < -0.15:
                corr_msg = " There is a strong negative correlation between high scrolling time and your mood/execution."
            suggestions.append({
                "type": "Focus & Dopamine Restructuring",
                "text": f"Your average scrolling screen time is high ({avg_scroll:.1f} mins).{corr_msg} Action: Utilize the 'Grayscale Focus' mode on your phone and limit scrolling apps to 15 minutes max tomorrow."
            })
            
    # 6.3 Water Intake advice
    if not pd.isna(avg_water):
        if avg_water < 1800:
            suggestions.append({
                "type": "Hydration Index",
                "text": f"Your average hydration is {avg_water:.0f}ml, which is below the optimal 2L baseline. Cellular dehydration induces subtle lethargy. Action: Log a full glass of water immediately and set hourly reminders."
            })
            
    # 6.4 Goal alignment
    goal = selected_user.get("ultimateGoal", {})
    if goal and goal.get("title"):
        suggestions.append({
            "type": "Ultimate Goal Alignment",
            "text": f"Focus check: You are working toward: \"{colors.BOLD}{goal.get('title')}{colors.ENDC}\" (Target: {goal.get('targetDate')}). Connect your daily micro-habits directly to this milestone. Make tomorrow's mandatory routine count."
        })
        
    if not suggestions:
        suggestions.append({
            "type": "General Habit Maintenance",
            "text": "Your metrics reflect a balanced state. Focus on maintaining consistency and tracking all metrics daily to unlock predictive machine learning insights."
        })
        
    for i, s in enumerate(suggestions, 1):
        print(f"{i}. {colors.BOLD}[{s['type']}]{colors.ENDC} {s['text']}")
        
    print(f"\n{colors.BOLD}====================================================================={colors.ENDC}")
    
    # 7. Generate Matplotlib Plot
    plt.style.use('dark_background')
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(15, 6), facecolor='#121214')
    ax1.set_facecolor('#1e1e24')
    ax2.set_facecolor('#1e1e24')
    
    # Plot 1: Productivity Trends over Time
    dates_labels = df['date'].dt.strftime('%b %d')
    ax1.plot(dates_labels, df['productivity_score'], marker='o', linewidth=2.5, color='#6366f1', label='Productivity Score')
    if 'sleep_duration' in df.columns and not df['sleep_duration'].isnull().all():
        # Scale sleep to fit on same chart 0-100 (mult by 10)
        ax1.plot(dates_labels, df['sleep_duration'] * 10, marker='s', linestyle='--', linewidth=1.5, color='#10b981', label='Sleep Hours (x10)')
    if 'mood' in df.columns and not df['mood'].isnull().all():
        # Scale mood to 0-100 (mult by 20)
        ax1.plot(dates_labels, df['mood'] * 20, marker='^', linestyle=':', linewidth=1.5, color='#f59e0b', label='Mood rating (x20)')
        
    # Mark tomorrow's prediction
    forecast_idx = len(df)
    ax1.plot(forecast_idx, predicted_score, marker='*', markersize=15, color='#ef4444', label=f"Tomorrow's Forecast ({predicted_score})")
    
    ax1.set_title("Productivity & Habit Timeline", fontsize=13, fontweight='bold', pad=15, color='#f8fafc')
    ax1.set_xlabel("Date", fontsize=10, labelpad=10, color='#94a3b8')
    ax1.set_ylabel("Score / Scaled Metric", fontsize=10, labelpad=10, color='#94a3b8')
    ax1.tick_params(colors='#94a3b8')
    ax1.grid(True, linestyle=':', alpha=0.3, color='#475569')
    ax1.legend(loc='best', framealpha=0.8, facecolor='#1e1e24', edgecolor='#334155')
    
    # Rotate date ticks if there are many
    if len(dates_labels) > 8:
        ax1.set_xticks(range(0, len(dates_labels), max(1, len(dates_labels) // 7)))
        
    # Plot 2: Feature Correlations
    if correlations:
        corr_keys = list(correlations.keys())
        corr_vals = list(correlations.values())
        
        # Make labels prettier
        pretty_keys = [k.replace('_', ' ').title() for k in corr_keys]
        
        # Color bar based on positive/negative impact
        bar_colors = ['#10b981' if v > 0 else '#ef4444' for v in corr_vals]
        
        bars = ax2.barh(pretty_keys, corr_vals, color=bar_colors, edgecolor='#334155', height=0.5)
        ax2.axvline(0, color='#94a3b8', linewidth=1, linestyle='--')
        
        ax2.set_xlim(-1.0, 1.0)
        ax2.set_title("Factor Correlations with Productivity", fontsize=13, fontweight='bold', pad=15, color='#f8fafc')
        ax2.set_xlabel("Correlation Coefficient (Pearson r)", fontsize=10, labelpad=10, color='#94a3b8')
        ax2.tick_params(colors='#94a3b8')
        ax2.grid(True, linestyle=':', alpha=0.3, color='#475569')
        
        # Add values on the bars
        for bar, val in zip(bars, corr_vals):
            width = bar.get_width()
            align = 'left' if width < 0 else 'right'
            offset = -0.15 if width < 0 else 0.05
            ax2.text(width + offset, bar.get_y() + bar.get_height()/2, f"{val:+.2f}", 
                     va='center', ha=align, color='#f8fafc', fontweight='bold', fontsize=9)
    else:
        ax2.text(0.5, 0.5, "Insufficient data points to compute correlations.\nKeep logging habits!", 
                 ha='center', va='center', color='#94a3b8', fontsize=11)
        ax2.set_title("Factor Correlations", fontsize=13, fontweight='bold', pad=15, color='#f8fafc')
        
    plt.tight_layout()
    
    # Save the output chart
    os.makedirs(output_dir, exist_ok=True)
    chart_path = os.path.join(output_dir, "productivity_analysis.png")
    plt.savefig(chart_path, dpi=150, facecolor='#121214')
    plt.close()
    
    print(f"\n{colors.GREEN}Success: Productivity report generated successfully.{colors.ENDC}")
    print(f"Chart saved to: {colors.BOLD}{colors.UNDERLINE}{chart_path}{colors.ENDC}\n")
    return True

def main():
    parser = argparse.ArgumentParser(description="Life OS Productivity Analytics & Forecast Engine")
    parser.add_argument("--user-id", type=str, help="Specific User ID to analyze")
    parser.add_argument("--list-users", action="store_true", help="List registered users and log summaries")
    parser.add_argument("--generate-mock", action="store_true", help="Generate 30-day realistic mock log files for testing")
    parser.add_argument("--days", type=int, default=30, help="Number of recent days to include in correlation and analysis")
    parser.add_argument("--output-dir", type=str, help="Directory to save the visualization chart")
    
    args = parser.parse_args()
    
    # Determine base backend/data directory relative to this script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.abspath(os.path.join(script_dir, "..", "backend", "data"))
    
    if not os.path.exists(data_dir):
        # Fallback to current directory backend/data check
        data_dir = os.path.abspath("./backend/data")
        
    # Determine output directory
    output_dir = args.output_dir if args.output_dir else script_dir
    
    if args.list_users:
        users = load_json(os.path.join(data_dir, "users.json"))
        sleep_logs = load_json(os.path.join(data_dir, "sleepLogs.json"))
        mood_logs = load_json(os.path.join(data_dir, "moodLogs.json"))
        
        print(f"\n{colors.HEADER}{colors.BOLD}Registered Users and Active Database Logs:{colors.ENDC}")
        print(f"{'-'*75}")
        print(f"{'User ID':<26} | {'Name':<15} | {'Email':<30}")
        print(f"{'-'*75}")
        for u in users:
            print(f"{u.get('id'):<26} | {u.get('name'):<15} | {u.get('email'):<30}")
        print(f"{'-'*75}")
        
        # Summary counts
        print(f"Total Sleep Logs logged: {len(sleep_logs)}")
        print(f"Total Mood Logs logged: {len(mood_logs)}")
        print(f"Total Tasks registered: {len(load_json(os.path.join(data_dir, 'tasks.json')))}")
        return 0
        
    # Get active user ID if not specified
    users = load_json(os.path.join(data_dir, "users.json"))
    user_id = args.user_id
    if not user_id and users:
        user_id = users[0].get("id")
        
    if not user_id:
        print(f"{colors.RED}Error: Could not locate active user. Ensure database folders exist.{colors.ENDC}")
        return 1
        
    if args.generate_mock:
        generate_mock_history(data_dir, user_id)
        
    success = run_analysis(data_dir, user_id, args.days, output_dir)
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())

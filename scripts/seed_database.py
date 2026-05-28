#!/usr/bin/env python3
"""
Life OS Database Seeder
Author: Antigravity AI
Date: 2026-05-29
Description: Downloads the synthetic daily wellness dataset from Kaggle,
             maps columns to our schemas, and seeds local JSON databases,
             Supabase REST APIs, or Firebase Firestore databases.
"""

import os
import sys
import json
import argparse
from datetime import datetime, timedelta

# Mock get_web_endpoint to fix kagglehub/kagglesdk import issue
try:
    import kagglesdk.kaggle_env
    kagglesdk.kaggle_env.get_web_endpoint = lambda *args, **kwargs: "https://www.kaggle.com"
except ImportError:
    pass

try:
    import kagglehub
    import pandas as pd
    import numpy as np
    import requests
except ImportError as e:
    print(f"Error: Missing dependency: {e}")
    print("Please install required libraries: pip install kagglehub pandas numpy requests")
    sys.exit(1)

# CLI Colors
class colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BOLD = '\033[1m'
    ENDC = '\033[0m'

def load_json(filepath):
    if not os.path.exists(filepath):
        return []
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read().strip()
            return json.loads(content) if content else []
    except Exception as e:
        print(f"{colors.RED}Error reading {filepath}: {e}{colors.ENDC}")
        return []

def save_json(filepath, data):
    try:
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2)
        return True
    except Exception as e:
        print(f"{colors.RED}Error saving {filepath}: {e}{colors.ENDC}")
        return False

def download_dataset():
    print(f"{colors.CYAN}Downloading dataset from Kaggle using kagglehub...{colors.ENDC}")
    try:
        path = kagglehub.dataset_download("wafaaelhusseini/worklife-balance-synthetic-daily-wellness-dataset")
        print(f"{colors.GREEN}Dataset downloaded to cache: {path}{colors.ENDC}")
        return path
    except Exception as e:
        print(f"{colors.RED}Failed to download dataset from Kaggle: {e}{colors.ENDC}")
        return None

def map_records(df, user_id, target_user_id, num_days):
    # Filter for the Kaggle user
    user_df = df[df['user_id'] == user_id].copy()
    if user_df.empty:
        print(f"{colors.RED}Error: Kaggle user {user_id} has no records in the dataset.{colors.ENDC}")
        return None
    
    # Sort by date and take the most recent logs
    user_df = user_df.sort_values('date', ascending=False).head(num_days)
    # Reverse to make it chronological (oldest to newest)
    user_df = user_df.iloc[::-1]
    
    records = {
        "user_profile": None,
        "sleep": [],
        "mood": [],
        "dopamine": [],
        "fitness": [],
        "tasks": []
    }
    
    # Map User Profile from the first record in the subset
    first_row = user_df.iloc[0]
    records["user_profile"] = {
        "height": int(first_row.get("height_cm", 170)) if not pd.isna(first_row.get("height_cm")) else 170,
        "targetWeight": int(first_row.get("weight_kg", 70) - 2) if not pd.isna(first_row.get("weight_kg")) else 70,
        "gender": "male" if first_row.get("sex") == "Male" else ("female" if first_row.get("sex") == "Female" else "other")
    }
    
    # Generate tasks templates for completion seeding
    task_templates = [
        {"title": "Complete daily work blocks", "category": "study", "isMandatory": True},
        {"title": "Log daily workouts", "category": "workout", "isMandatory": False},
        {"title": "Keep screen time under control", "category": "custom", "isMandatory": True},
        {"title": "Achieve 2L Hydration target", "category": "fitness", "isMandatory": True}
    ]
    
    for template in task_templates:
        records["tasks"].append({
            "userId": target_user_id,
            "title": template["title"],
            "category": template["category"],
            "isMandatory": template["isMandatory"],
            "completedDates": [],
            "isActive": True,
            "createdAt": datetime.now().isoformat() + "Z",
            "id": f"kaggle-task-{template['category']}-{target_user_id}"
        })
    
    # Map logs day by day
    for _, row in user_df.iterrows():
        # Dates should map to current timeline
        date_str = str(row['date'])
        
        # 1. Sleep Log
        sleep_hrs = float(row.get("sleep_hours", 7.0))
        sleep_qual_10 = int(row.get("sleep_quality", 6))
        # Scale 1-10 to 1-5
        sleep_qual_5 = max(1, min(5, round(sleep_qual_10 / 2)))
        sleep_sc = int(sleep_qual_10 * 10)
        
        # Calculate wake time relative to 23:00 sleep time
        wake_hour = (23 + int(sleep_hrs)) % 24
        wake_min = int((sleep_hrs - int(sleep_hrs)) * 60)
        wake_time_str = f"{wake_hour:02d}:{wake_min:02d}"
        
        records["sleep"].append({
            "userId": target_user_id,
            "date": date_str,
            "sleepTime": "23:00",
            "wakeTime": wake_time_str,
            "duration": round(sleep_hrs, 1),
            "quality": sleep_qual_5,
            "sleepScore": sleep_sc,
            "id": f"kaggle-sleep-{target_user_id}-{date_str}"
        })
        
        # 2. Mood Log
        mood_10 = int(row.get("mood_score", 6))
        mood_5 = max(1, min(5, round(mood_10 / 2)))
        stress_lvl = int(row.get("stress_level", 4))
        reflection = f"Workday. Stress Level: {stress_lvl}/10. Focus Rating: {row.get('focus_score', 5)}/10."
        
        records["mood"].append({
            "userId": target_user_id,
            "date": date_str,
            "mood": mood_5,
            "reflection": reflection,
            "id": f"kaggle-mood-{target_user_id}-{date_str}"
        })
        
        # 3. Dopamine Log
        scr_time = float(row.get("screen_time_hours", 4.0))
        total_mins = int(scr_time * 60)
        inst_mins = int(total_mins * 0.4)
        yt_mins = int(total_mins * 0.3)
        scroll_mins = int(total_mins * 0.3)
        focus_sc_10 = int(row.get("focus_score", 6))
        dop_score = max(10, min(100, int(focus_sc_10 * 10)))
        
        records["dopamine"].append({
            "userId": target_user_id,
            "date": date_str,
            "instagramMins": inst_mins,
            "youtubeMins": yt_mins,
            "scrollingMins": scroll_mins,
            "totalMinutes": total_mins,
            "dopamineScore": dop_score,
            "id": f"kaggle-dopamine-{target_user_id}-{date_str}"
        })
        
        # 4. Fitness Log
        weight = float(row.get("weight_kg", 70.0))
        water_ml = 2000 if row.get("exercise_minutes", 0) > 30 else 1500
        
        records["fitness"].append({
            "userId": target_user_id,
            "date": date_str,
            "waterIntake": water_ml,
            "weight": round(weight, 1),
            "id": f"kaggle-fitness-{target_user_id}-{date_str}"
        })
        
        # 5. Seeding Task Completion Dates
        # Completed dates mapped to task lists
        tasks_compl = int(row.get("tasks_completed", 0))
        ex_mins = float(row.get("exercise_minutes", 0))
        
        if tasks_compl >= 3:
            # Map completion for "Complete daily work blocks"
            records["tasks"][0]["completedDates"].append(date_str)
        if ex_mins >= 30:
            # Map completion for "Log daily workouts"
            records["tasks"][1]["completedDates"].append(date_str)
        if scr_time <= 5.0:
            # Map completion for "Keep screen time under control"
            records["tasks"][2]["completedDates"].append(date_str)
        if water_ml >= 2000:
            # Map completion for "Achieve 2L Hydration target"
            records["tasks"][3]["completedDates"].append(date_str)
            
    return records

def seed_local_json(data_dir, email, mapped_data):
    users = load_json(os.path.join(data_dir, "users.json"))
    if not users:
        print(f"{colors.RED}Error: No users found in users.json. Register a user in the UI first.{colors.ENDC}")
        return False
    
    target_user = next((u for u in users if u.get("email").lower() == email.lower()), None)
    if not target_user:
        # Fallback to the first user
        target_user = users[0]
        print(f"{colors.YELLOW}Warning: User with email {email} not found. Seeding first user: {target_user.get('email')}{colors.ENDC}")
        
    user_id = target_user.get("id")
    
    # Update profile variables
    target_user.update(mapped_data["user_profile"])
    save_json(os.path.join(data_dir, "users.json"), users)
    print(f"Updated profile fields for user: {target_user.get('email')}")
    
    # Seed logs
    log_files = [
        ("sleepLogs.json", mapped_data["sleep"]),
        ("moodLogs.json", mapped_data["mood"]),
        ("dopamineLogs.json", mapped_data["dopamine"]),
        ("fitnessLogs.json", mapped_data["fitness"])
    ]
    
    for filename, new_logs in log_files:
        filepath = os.path.join(data_dir, filename)
        existing_logs = load_json(filepath)
        # Filter out existing logs of the target user to prevent duplicates
        filtered_logs = [log for log in existing_logs if log.get("userId") != user_id]
        # Append new logs
        filtered_logs.extend(new_logs)
        save_json(filepath, filtered_logs)
        print(f"Seeded {len(new_logs)} records into {filename}")
        
    # Seed tasks
    tasks_path = os.path.join(data_dir, "tasks.json")
    existing_tasks = load_json(tasks_path)
    filtered_tasks = [t for t in existing_tasks if t.get("userId") != user_id]
    filtered_tasks.extend(mapped_data["tasks"])
    save_json(tasks_path, filtered_tasks)
    print(f"Seeded 4 task templates into tasks.json")
    
    print(f"{colors.GREEN}Seeding completed successfully for local JSON databases!{colors.ENDC}")
    return True

def seed_supabase(url, key, mapped_data):
    print(f"{colors.CYAN}Seeding Supabase REST API at: {url}...{colors.ENDC}")
    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates"
    }
    
    # Format tables mapping
    tables_data = [
        ("sleep_logs", mapped_data["sleep"]),
        ("mood_logs", mapped_data["mood"]),
        ("dopamine_logs", mapped_data["dopamine"]),
        ("fitness_logs", mapped_data["fitness"]),
        ("tasks", mapped_data["tasks"])
    ]
    
    success = True
    for table_name, rows in tables_data:
        try:
            endpoint = f"{url.rstrip('/')}/rest/v1/{table_name}"
            # Convert fields to camelCase or match standard schema columns
            # (In Supabase, schema columns should match keys)
            res = requests.post(endpoint, headers=headers, json=rows)
            if res.status_code in [200, 201, 204]:
                print(f"{colors.GREEN}Supabase Table '{table_name}': Successfully inserted/merged {len(rows)} rows.{colors.ENDC}")
            else:
                print(f"{colors.RED}Supabase Table '{table_name}' failed (Status {res.status_code}): {res.text}{colors.ENDC}")
                success = False
        except Exception as e:
            print(f"{colors.RED}Supabase connection error for table {table_name}: {e}{colors.ENDC}")
            success = False
            
    return success

def seed_firebase(project_id, api_key, user_id, mapped_data):
    print(f"{colors.CYAN}Seeding Firebase Firestore REST API for Project: {project_id}...{colors.ENDC}")
    # Firestore REST Endpoint structure:
    # POST https://firestore.googleapis.com/v1/projects/{project_id}/databases/(default)/documents/{collection}?documentId={id}
    # Payload must map to Firestore field types (stringValue, integerValue, etc.)
    # Because Firestore REST JSON structures are nested, we map them helper function:
    
    def to_firestore_val(v):
        if isinstance(v, bool):
            return {"booleanValue": v}
        elif isinstance(v, (int, float)):
            return {"doubleValue": float(v)}
        elif isinstance(v, list):
            return {"arrayValue": {"values": [to_firestore_val(x) for x in v]}}
        elif isinstance(v, dict):
            return {"mapValue": {"fields": {k: to_firestore_val(val) for k, val in v.items()}}}
        else:
            return {"stringValue": str(v)}
            
    headers = {
        "Content-Type": "application/json"
    }
    
    success = True
    collections = [
        ("sleep_logs", mapped_data["sleep"]),
        ("mood_logs", mapped_data["mood"]),
        ("dopamine_logs", mapped_data["dopamine"]),
        ("fitness_logs", mapped_data["fitness"]),
        ("tasks", mapped_data["tasks"])
    ]
    
    for collection_name, rows in collections:
        count = 0
        for row in rows:
            doc_id = row.get("id")
            fields = {k: to_firestore_val(val) for k, val in row.items()}
            payload = {"fields": fields}
            
            try:
                # If API Key is provided, append it to URL
                url_postfix = f"?documentId={doc_id}"
                if api_key:
                    url_postfix += f"&key={api_key}"
                
                endpoint = f"https://firestore.googleapis.com/v1/projects/{project_id}/databases/(default)/documents/{collection_name}{url_postfix}"
                
                # Check document existence or patch (using PATCH to write/overwrite)
                patch_endpoint = f"https://firestore.googleapis.com/v1/projects/{project_id}/databases/(default)/documents/{collection_name}/{doc_id}"
                if api_key:
                    patch_endpoint += f"?key={api_key}"
                    
                res = requests.patch(patch_endpoint, headers=headers, json=payload)
                if res.status_code in [200, 201]:
                    count += 1
                else:
                    # Fallback to post if document does not exist
                    post_endpoint = f"https://firestore.googleapis.com/v1/projects/{project_id}/databases/(default)/documents/{collection_name}?documentId={doc_id}"
                    if api_key:
                        post_endpoint += f"&key={api_key}"
                    res2 = requests.post(post_endpoint, headers=headers, json=payload)
                    if res2.status_code in [200, 201]:
                        count += 1
            except Exception as e:
                print(f"{colors.RED}Firebase Firestore connection error: {e}{colors.ENDC}")
                success = False
                break
                
        if count > 0:
            print(f"{colors.GREEN}Firebase Collection '{collection_name}': Successfully seeded {count} documents.{colors.ENDC}")
            
    return success

def main():
    parser = argparse.ArgumentParser(description="Kaggle Dataset Seeder for Wellness & Productivity Logs")
    parser.add_argument("--target", type=str, choices=["json", "supabase", "firebase"], default="json",
                        help="Target database to seed: 'json' (local), 'supabase', or 'firebase'")
    parser.add_argument("--user-email", type=str, default="shirshakmondaljspbuet@gmail.com",
                        help="Email of the user to map database logs to")
    parser.add_argument("--kaggle-user-id", type=int, default=1,
                        help="User ID inside the Kaggle dataset to read logs from (default: 1)")
    parser.add_argument("--days", type=int, default=30,
                        help="Number of days of history to seed (default: 30)")
    
    # Supabase Args
    parser.add_argument("--supabase-url", type=str, help="Supabase REST API URL")
    parser.add_argument("--supabase-key", type=str, help="Supabase API key (service role role recommended)")
    
    # Firebase Args
    parser.add_argument("--firebase-project", type=str, help="Firebase Project ID")
    parser.add_argument("--firebase-key", type=str, help="Firebase Web API Key (optional)")

    args = parser.parse_args()
    
    # Determine base backend/data directory relative to this script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.abspath(os.path.join(script_dir, "..", "backend", "data"))
    if not os.path.exists(data_dir):
         data_dir = os.path.abspath("./backend/data")

    # Download Dataset
    path = download_dataset()
    if not path:
        print(f"{colors.RED}Aborting seeder: Dataset download failed.{colors.ENDC}")
        sys.exit(1)
        
    csv_path = os.path.join(path, "daily_all.csv")
    if not os.path.exists(csv_path):
        print(f"{colors.RED}Error: Mapped daily_all.csv file missing in downloaded folder.{colors.ENDC}")
        sys.exit(1)
        
    # Read dataset
    print(f"Reading synthetic wellness logs from {csv_path}...")
    df = pd.read_csv(csv_path)
    
    # Get user details for local mappings
    target_user_id = f"kaggle-user-{args.kaggle_user_id}"
    if args.target == "json":
        users = load_json(os.path.join(data_dir, "users.json"))
        target_user = next((u for u in users if u.get("email").lower() == args.user_email.lower()), None)
        if target_user:
            target_user_id = target_user.get("id")
            
    # Process and Map Data
    print(f"Mapping Kaggle logs to schema for user: {target_user_id}...")
    mapped_data = map_records(df, args.kaggle_user_id, target_user_id, args.days)
    
    if not mapped_data:
        print(f"{colors.RED}Aborting seeder: Data mapping failed.{colors.ENDC}")
        sys.exit(1)
        
    # Seed Target
    if args.target == "json":
        success = seed_local_json(data_dir, args.user_email, mapped_data)
    elif args.target == "supabase":
        url = args.supabase_url or os.environ.get("SUPABASE_URL")
        key = args.supabase_key or os.environ.get("SUPABASE_KEY")
        if not url or not key:
            print(f"{colors.RED}Error: Supabase requires --supabase-url and --supabase-key parameters or environment variables.{colors.ENDC}")
            sys.exit(1)
        success = seed_supabase(url, key, mapped_data)
    elif args.target == "firebase":
        project_id = args.firebase_project or os.environ.get("FIREBASE_PROJECT_ID")
        api_key = args.firebase_key or os.environ.get("FIREBASE_API_KEY")
        if not project_id:
            print(f"{colors.RED}Error: Firebase requires --firebase-project parameter or FIREBASE_PROJECT_ID environment variable.{colors.ENDC}")
            sys.exit(1)
        success = seed_firebase(project_id, api_key, target_user_id, mapped_data)
        
    if success:
        print(f"\n{colors.HEADER}{colors.BOLD}=====================================================================")
        print(f"                 DATABASE SEEDING PROCESS COMPLETE                  ")
        print(f"====================================================================={colors.ENDC}")
        print(f"{colors.GREEN}Seeding target: {args.target.upper()} | User ID: {target_user_id} | Days: {args.days}{colors.ENDC}")
        print("Ready to run analytics reports and explore wellness correlations!")
        sys.exit(0)
    else:
        print(f"{colors.RED}Seeding completed with errors.{colors.ENDC}")
        sys.exit(1)

if __name__ == "__main__":
    main()

# data_loader.py

import os
from pathlib import Path
import pandas as pd
import numpy as np
import requests
from sentence_transformers import SentenceTransformer

# 1. Supabase Configuration

API_KEY = os.getenv(
    "SUPABASE_API_KEY",
    "sb_publishable_h889CjrPIGwCMA9I4oTTaA_2L22Y__R"
)

BASE_URL = os.getenv(
    "SUPABASE_BASE_URL",
    "https://jrkqcbmjknzgpbtrupxh.supabase.co/rest/v1"
)

# 2. Helper: Fetch Supabase Tables

def fetch_full_table(table_name, batch_size=1000):
    url = f"{BASE_URL}/{table_name}"
    all_data = []
    start = 0

    while True:
        end = start + batch_size - 1
        headers = {
            "apikey": API_KEY,
            "Authorization": f"Bearer {API_KEY}",
            "Range": f"{start}-{end}"
        }

        res = requests.get(url, headers=headers)
        res.raise_for_status()
        batch = res.json()

        if not batch:
            break

        all_data.extend(batch)
        start += batch_size

    print(f"[OK] Loaded {table_name}: {len(all_data)} rows")
    return all_data

# 3. Load Supabase 

lp_full = fetch_full_table("learning_paths")
courses_full = fetch_full_table("courses")
levels_full = fetch_full_table("course_levels")
tutorials_full = fetch_full_table("tutorials")

df_lp = pd.DataFrame(lp_full)
df_course = pd.DataFrame(courses_full)
df_level = pd.DataFrame(levels_full)
df_tutorial = pd.DataFrame(tutorials_full)

# 4. Build Knowledge Base

def clean_text(x):
    if isinstance(x, str):
        return x.lower().strip()
    return ""

kb = (
    df_course
    .merge(df_lp, on="learning_path_id")
    .merge(df_level, left_on="course_level_str", right_on="id")
    .merge(df_tutorial, on="course_id", how="left")
)

kb["clean_course"] = kb["course_name"].apply(clean_text)
kb["clean_tutorial"] = kb["tutorial_title"].fillna("").apply(clean_text)

kb = kb.dropna(subset=["tutorial_title"]).drop_duplicates().reset_index(drop=True)

# 5. Embedding

print("[INFO] Loading embedding model...")
model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

course_texts = kb["clean_course"].unique().tolist()
tutorial_texts = kb["clean_tutorial"].unique().tolist()

print("[INFO] Encoding courses...")
course_emb = model.encode(course_texts, show_progress_bar=True)

print("[INFO] Encoding tutorials...")
tutorial_emb = model.encode(tutorial_texts, show_progress_bar=True)

# 6. Load CSV Datasets

BASE_DIR = Path(__file__).resolve().parent
DATASET_DIR = BASE_DIR / "dataset"

def load_csv(filename):
    path = DATASET_DIR / filename
    try:
        df = pd.read_csv(path)
        print(f"[OK] Loaded {filename} → {df.shape}")
        return df
    except Exception as e:
        print(f"[ERROR] Cannot load {filename}:", e)
        return None

learning_path_answer = load_csv(
    "Resource Data Learning Buddy - Learning Path Answer.csv"
)

current_interest_questions = load_csv(
    "Resource Data Learning Buddy - Current Interest Questions.csv"
)

current_tech_questions = load_csv(
    "Assesment - Current Tech Questions.csv"
)

question_lp_junction = load_csv(
    "Assesment - Question LP Junction.csv"
)

skill_keywords = load_csv(
    "Resource Data Learning Buddy - Skill Keywords.csv"
)

student_progress = load_csv(
    "Resource Data Learning Buddy - Student Progress.csv"
)

# 7. Path Mappings

qid_to_lpid = (
    question_lp_junction
    .set_index("question_id")["learning_path_id"]
    .to_dict()
)

lpid_to_qids = (
    question_lp_junction
    .groupby("learning_path_id")["question_id"]
    .apply(list)
    .to_dict()
)

lp_metadata = (
    learning_path_answer
    .set_index("id")
    .to_dict(orient="index")
)

print("\n=== ✅ Data Loader Ready ===")

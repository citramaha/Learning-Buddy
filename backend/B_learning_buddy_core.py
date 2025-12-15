from typing import Tuple, Dict, List, Any
import random
import re
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

# Import data & embeddings from your data loader
import A_data_loader as dl  # <-- ganti nama import jika kamu menggunakan nama file lain

# If you use Groq client in global namespace, import it (or import client from main)
import os
from groq import Groq

client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)

# ---------------------------
# Persistent in-memory states
# ---------------------------
tech_assessment_state = {
    "current_lp": None,
    "question_list": None,         # all questions for LP (DataFrame expected)
    "selected_questions": None,    # sampled questions DataFrame
    "current_index": 0,
    "user_answers": [],
    "finished": False
}

# (chat_state is kept in runner or can be used from here)
chat_state = {
    "stage": "idle",           # idle, awaiting_start, interest, interest_confirm, choose_n, awaiting_answer, finished
    "last_options": None,
    "assessment_n": None,
    "selected_lp_id": None,
    "selected_lp_name": None,
    "last_level": None,
    "weakest_skill": None
}

# per-user progress history (in-memory)
user_learning_progress: Dict[str, Dict[str, Any]] = {}  # user -> {lp_id, history: [ {skill:score} ]}

# ---------------------------
# Utility helpers
# ---------------------------
def convert_to_skill_level(pct: float) -> str:
    """Convert percent to level label (Beginner/Intermediate/Advanced)."""
    if pct >= 80:
        return "Advanced"
    if pct >= 50:
        return "Intermediate"
    return "Beginner"

def convert_pct_to_label(pct: float) -> str:
    return convert_to_skill_level(pct)

def map_letter_to_option(row, letter: str) -> str:
    # Map A/B/C/D to the option string stored in row
    letter = letter.upper().strip()
    if letter == "A": return row["option_1"]
    if letter == "B": return row["option_2"]
    if letter == "C": return row["option_3"]
    if letter == "D": return row["option_4"]
    return ""

# ---------------------------
# Interest & questions helpers
# (these depend on your CSVs loaded in data_loader)
# ---------------------------
def run_interest_assessment() -> Tuple[str, Any]:
    """
    Return (question_text, options_df)
    Expects dl.current_interest_questions (DataFrame)
    """
    # build a simple prompt using the CSV table
    try:
        df = dl.current_interest_questions.copy()
        # Pick the first question set (or random)
        qrow = df.iloc[0]
        question = qrow["question_text"] if "question_text" in qrow else qrow.get("question", "Pilih aktivitas yang paling relate")
        # options assumed columns option_1..option_4
        options = df[["option_1", "option_2", "option_3", "option_4"]].iloc[[0]]
        # prepare display
        out = f"🎯 **Pertanyaan Minat Belajar**\n{question}\n\n"
        for i, col in enumerate(["option_1", "option_2", "option_3", "option_4"]):
            out += f"{i+1}. {qrow.get(col)}\n"
        # return options as a small DF-like object (we will accept ORIG df later)
        return out, df.loc[[0]]
    except Exception as e:
        return "Tidak dapat memuat pertanyaan minat sekarang.", None

def process_interest_choice(choice_index: int, options_df) -> str:
    # Map choice to category via your mapping CSV (skill_keywords / junction)
    try:
        opt_text = options_df.iloc[0][f"option_{choice_index}"]
    except Exception:
        # safe fallback: choose first
        opt_text = options_df.iloc[0].get("option_1", "Artificial Intelligence")

    # try to map keywords -> learning path using skill_keywords or heuristic
    # If you have 'skill_keywords' dataframe in dl, we can do basic matching
    category = "Artificial Intelligence"
    if hasattr(dl, "skill_keywords"):
        kwdf = dl.skill_keywords
        user_words = re.sub(r"[^a-z0-9 ]", "", str(opt_text).lower()).split()
        # naive scoring
        scores = {}
        for _, r in kwdf.iterrows():
            k = str(r.get("keyword", "")).lower()
            for w in user_words:
                if w and w in k:
                    # map to skill or learning_path_id if column exists
                    scores[k] = scores.get(k, 0) + 1
        if scores:
            # pick top keyword — fallback map manually
            top = sorted(scores.items(), key=lambda x: -x[1])[0][0]
            # try heuristic: keyword contains 'ai' etc
            if "ai" in top or "artificial" in top or "machine" in top:
                category = "Artificial Intelligence"

    # map category to learning path using dl.lp_metadata if available
    lp_name = "AI Engineer"
    if hasattr(dl, "lp_metadata"):
        for id_, meta in dl.lp_metadata.items():
            if isinstance(meta, dict) and category.lower() in str(meta.get("tags", "")).lower():
                lp_name = meta.get("learning_path_name", lp_name)

    return f"✨ Kamu tertarik pada *{category}*. Learning Path yang cocok: **{lp_name}**"

# ---------------------------
# Tech assessment functions
# ---------------------------
def get_tech_questions_for_lp(lp_id):
    """Return DataFrame of tech questions for the LP. Expects dl.current_tech_questions and dl.question_lp_junction."""
    if not hasattr(dl, "current_tech_questions") or not hasattr(dl, "question_lp_junction"):
        return dl.current_tech_questions if hasattr(dl, "current_tech_questions") else None
    # find question ids from junction
    qids = dl.question_lp_junction[dl.question_lp_junction["learning_path_id"] == lp_id]["question_id"].tolist()
    dfq = dl.current_tech_questions[dl.current_tech_questions["question_id"].isin(qids)].copy()
    # if df empty fallback to full set
    if dfq.empty:
        return dl.current_tech_questions.copy()
    return dfq

def start_tech_assessment(lp_id: int, n_questions: int = 10) -> str:
    df_questions = get_tech_questions_for_lp(lp_id)
    if df_questions is None or df_questions.empty:
        return "❗ Tidak ada pertanyaan teknis untuk learning path ini."

    # sample consistently
    n = min(n_questions, df_questions.shape[0])
    selected = df_questions.sample(n=n, random_state=random.randint(0,9999)).reset_index(drop=True)

    tech_assessment_state["current_lp"] = lp_id
    tech_assessment_state["question_list"] = df_questions
    tech_assessment_state["selected_questions"] = selected
    tech_assessment_state["current_index"] = 0
    tech_assessment_state["user_answers"] = []
    tech_assessment_state["finished"] = False

    q = selected.iloc[0]
    prompt = (
        f"🧠 **Tech Skill Assessment Dimulai ({n} soal)!**\n\n"
        f"Pertanyaan 1:\n{q['question_desc']}\n\n"
        f"A. {q['option_1']}\n"
        f"B. {q['option_2']}\n"
        f"C. {q['option_3']}\n"
        f"D. {q['option_4']}\n\nSilakan jawab dengan A/B/C/D."
    )
    return prompt

def answer_tech_question(user_letter: str) -> str:
    if tech_assessment_state["finished"]:
        return "Assessment sudah selesai. Ketik **lihat hasil**."

    idx = tech_assessment_state["current_index"]
    selected = tech_assessment_state["selected_questions"]

    if idx >= len(selected):
        tech_assessment_state["finished"] = True
        return "Assessment selesai! Ketik **lihat hasil**."

    tech_assessment_state["user_answers"].append(user_letter.upper().strip())
    tech_assessment_state["current_index"] += 1

    if tech_assessment_state["current_index"] >= len(selected):
        tech_assessment_state["finished"] = True
        return "Assessment selesai! Ketik **lihat hasil**."

    q = selected.iloc[tech_assessment_state["current_index"]]
    return (
        f"Pertanyaan {tech_assessment_state['current_index'] + 1}:\n"
        f"{q['question_desc']}\n\n"
        f"A. {q['option_1']}\n"
        f"B. {q['option_2']}\n"
        f"C. {q['option_3']}\n"
        f"D. {q['option_4']}\n\nSilakan jawab dengan A/B/C/D."
    )

def get_tech_assessment_result() -> Dict[str, Any]:
    if not tech_assessment_state["finished"] or tech_assessment_state["selected_questions"] is None:
        return {"error": "Assessment belum selesai."}
    selected = tech_assessment_state["selected_questions"]
    answers = tech_assessment_state["user_answers"]

    correct_count = 0
    for i, user_letter in enumerate(answers):
        row = selected.iloc[i]
        user_option = map_letter_to_option(row, user_letter)
        correct_answer = row.get("correct_answer") or row.get("answer") or row.get("correct_option")
        if user_option and correct_answer and str(user_option).strip().lower() == str(correct_answer).strip().lower():
            correct_count += 1

    total = len(selected)
    score_pct = (correct_count / total) * 100 if total > 0 else 0.0
    level_name = convert_to_skill_level(score_pct)

    return {
        "learning_path": tech_assessment_state["current_lp"],
        "correct": correct_count,
        "total": total,
        "score_pct": score_pct,
        "level_name": level_name
    }

def get_subskill_leveling() -> Dict[str, Dict[str, Any]]:
    if not tech_assessment_state["finished"] or tech_assessment_state["selected_questions"] is None:
        return {}
    selected = tech_assessment_state["selected_questions"]
    answers = tech_assessment_state["user_answers"]

    subskill_scores = {}
    for i, letter in enumerate(answers):
        row = selected.iloc[i]
        tag = row.get("skill_tag") or row.get("skill") or "General"
        if tag not in subskill_scores:
            subskill_scores[tag] = {"correct": 0, "total": 0}
        subskill_scores[tag]["total"] += 1
        if map_letter_to_option(row, letter) == row.get("correct_answer"):
            subskill_scores[tag]["correct"] += 1

    result = {}
    for tag, v in subskill_scores.items():
        pct = (v["correct"] / v["total"]) * 100 if v["total"]>0 else 0.0
        result[tag] = {
            "correct": v["correct"],
            "total": v["total"],
            "score_pct": pct,
            "level_name": convert_pct_to_label(pct)
        }
    return result

def pretty_subskill_report() -> str:
    res = get_subskill_leveling()
    if not res:
        return "Tidak ada data sub-skill (assessment belum selesai)."

    out = "📊 **Sub-Skill Analysis Result**\n\n"
    for tag, v in res.items():
        out += f"**{tag}**\n- Benar: {v['correct']} dari {v['total']}\n- Skor: {v['score_pct']:.1f}%\n- Level: {v['level_name']}\n\n"
    return out

# ---------------------------
# Recommendations & adaptive plan
# ---------------------------
def get_courses_by_level(level_name: str, lp_id: int) -> List[str]:
    df = dl.courses_full[dl.courses_full["learning_path_id"] == lp_id].copy()
    # ensure numeric level
    df["lvl"] = df["course_level_str"].astype(int)
    if level_name == "Beginner":
        df2 = df[df["lvl"].isin([1,2])]
    elif level_name == "Intermediate":
        df2 = df[df["lvl"] == 3]
    elif level_name == "Advanced":
        df2 = df[df["lvl"].isin([4,5])]
    else:
        df2 = df
    return df2["course_name"].dropna().unique().tolist()

def generate_step3_recommendation(lp_id: int) -> str:
    subskills = get_subskill_leveling()
    if not subskills:
        return ""
    # LP meta
    lp_meta = dl.df_lp[dl.df_lp["learning_path_id"] == lp_id]
    lp_name = lp_meta["learning_path_name"].values[0] if not lp_meta.empty else f"LP {lp_id}"
    out = f"🎯 **Hasil Assessment untuk Learning Path: {lp_name}**\n\n"
    out += "## 📊 Level Per Sub-Skill\n"
    weak_skills = []
    for tag, v in subskills.items():
        pct = v["score_pct"]
        label = convert_pct_to_label(pct)
        out += f"- **{tag}** → {label} ({pct:.1f}%)\n"
        if label == "Beginner":
            weak_skills.append(tag)
    out += "\n## ❗ Area yang perlu diperkuat\n"
    if weak_skills:
        for w in weak_skills:
            out += f"- {w}\n"
    else:
        out += "- Kamu sudah kuat di semua sub-skill! 🎉\n"
    # recommended classes (top 5 matching user's level)
    avg_pct = sum(v["score_pct"] for v in subskills.values()) / len(subskills)
    user_level = convert_pct_to_label(avg_pct)
    out += f"\n## 📚 Rekomendasi Kelas Dicoding\n**Level kamu saat ini: {user_level}**\n\n"
    rec = get_courses_by_level(user_level, lp_id)
    if not rec:
        out += "- Tidak ada kursus yang cocok.\n"
    else:
        for r in rec[:5]:
            out += f"- {r}\n"
    return out

def generate_adaptive_learning_plan(lp_id: int, user="default_user") -> str:
    subskills = get_subskill_leveling()
    if not subskills:
        return ""
    skill_scores = {tag: v["score_pct"] for tag, v in subskills.items()}
    if user not in user_learning_progress:
        user_learning_progress[user] = {"lp_id": lp_id, "history": []}
    user_learning_progress[user]["history"].append(skill_scores)
    history = user_learning_progress[user]["history"]
    weakest = min(skill_scores, key=skill_scores.get)
    improvement = None
    if len(history) >= 2:
        prev = history[-2]
        curr = history[-1]
        diff = {k: curr.get(k,0) - prev.get(k,0) for k in curr}
        best = max(diff, key=diff.get)
        improvement = (best, diff[best])
    lp_meta = dl.df_lp[dl.df_lp["learning_path_id"] == lp_id]
    lp_name = lp_meta["learning_path_name"].values[0] if not lp_meta.empty else f"LP {lp_id}"
    out = f"📘 **Adaptive Learning Plan — {lp_name}**\n\n"
    out += "### 🎯 Fokus Minggu Ini\n"
    out += f"- **{weakest}** → skor terendah ({skill_scores[weakest]:.1f}%)\n\n"
    if improvement:
        out += "### 📈 Perkembangan Terbaru\n"
        out += f"- **{improvement[0]}** meningkat **+{improvement[1]:.1f}%** dibandingkan sesi sebelumnya! 🚀\n\n"
    out += "### 🚀 Rencana Belajar Minggu Ini\n"
    out += f"1. Review ulang konsep dasar **{weakest}**\n"
    out += f"2. Ambil 1–2 materi pada Dicoding terkait **{weakest}**\n"
    out += f"3. Lakukan mini-quiz khusus subskill ini setelah 48 jam\n"
    out += f"4. Buat summary note untuk memperdalam pemahaman\n\n"
    out += "### 📅 Progress Tracking\n"
    out += f"- Total sesi assessment: **{len(history)}** kali"
    return out

# ---------------------------
# KB helpers (detail + roadmap)
# ---------------------------
def get_detail_course(course_name: str) -> str:
    subset = dl.kb[dl.kb["clean_course"] == str(course_name).lower()]
    if subset.empty:
        return "Course tidak ditemukan di knowledge base."
    out = f"📚 Detail materi untuk *{course_name}*:\n\n"
    for t in subset["tutorial_title"].dropna().unique().tolist():
        out += f"- {t}\n"
    return out

def get_roadmap_lp(lp_name: str) -> str:
    subset = dl.kb[dl.kb["learning_path_name"].str.lower() == str(lp_name).lower()]
    if subset.empty:
        return "Learning path tidak ditemukan."
    LEVEL_ORDER = {"Dasar": 1, "Pemula": 2, "Menengah": 3, "Mahir": 4, "Profesional": 5}
    subset = subset.copy()
    subset["level_sort"] = subset["course_level"].map(lambda x: LEVEL_ORDER.get(x, 99))
    subset = subset.sort_values("level_sort")
    out = f"📘 Roadmap untuk *{lp_name}*:\n\n"
    for cname in subset["course_name"].unique():
        sub = subset[subset["course_name"] == cname]
        level = sub["course_level"].iloc[0]
        total = sub["tutorial_id"].nunique()
        out += f"- {cname} (Level {level}) — {total} materi\n"
    return out

# ---------------------------
# LLM safe wrapper (uses global client if available)
# ---------------------------
def ask_llm_safe(prompt: str, state: dict) -> str:
    """
    Send to LLM with restrictive system prompt. If no client available, fallback message.
    """
    lp = state.get("selected_lp_name") or "—"
    level = state.get("last_level") or "—"
    weakest = state.get("weakest_skill") or "—"
    system_msg = (
        "Kamu adalah Learning Buddy. Jawab singkat dan jelas.\n"
        "- Jangan rekomendasikan kursus selain katalog Dicoding.\n"
        "- Jika diminta rekomendasi course, kembalikan ke fungsi rule-based.\n"
        f"- Konteks: LearningPath={lp}, Level={level}, Weakest={weakest}."
    )
    if client is None:
        return "LLM tidak tersedia saat ini. Coba fitur lain (roadmap atau detail course)."
    try:
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": system_msg},
                {"role": "user", "content": prompt}
            ],
            temperature=0.2,
            max_tokens=300
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        return "Gagal menghubungi LLM. Coba lagi nanti."

# ---------------------------
# small helper for improvement metrics
# ---------------------------
def get_skill_improvement(history: List[Dict[str,float]]):
    if len(history) < 2:
        return None
    prev = history[-2]
    curr = history[-1]
    diff = {k: curr.get(k,0) - prev.get(k,0) for k in curr}
    best = max(diff, key=diff.get)
    return best, diff[best]



# TAMBAHAN TAMBAHAN UNTUK RUN BOT VERSI API SARAN GPT

def handle_user_message(user_id: str, message: str) -> str:
    """
    ENTRY POINT UNTUK API / FRONTEND
    """
    u = message.strip()
    low = u.lower()

    # RESET
    if low in ["reset", "ulang", "hapus"]:
        chat_state.update({
            "stage":"idle",
            "last_level":None,
            "weakest_skill":None,
            "selected_lp_id":None,
            "selected_lp_name":None
        })
        return "Sesi direset 😊 Mau mulai assessment lagi?"

    # start
    if chat_state["stage"] == "idle" and any(g in low for g in ["hai","halo","hi","hello"]):
        chat_state["stage"] = "awaiting_start"
        return (
            "Halo! Aku **Learning Buddy** 😊\n\n"
            "Siap bantu tentukan jalur belajar terbaik.\n\n"
            "Mulai assessment minat belajar? (ketik YA)"
        )

    # awaiting_start
    if chat_state["stage"] == "awaiting_start" and low in ["ya","iya","y","yes","ok","oke"]:
        q, opt = run_interest_assessment()
        chat_state["stage"] = "interest"
        chat_state["last_options"] = opt
        return q

    # interest → pilih opsi
    if chat_state["stage"] == "interest" and low.isdigit():
        choice = int(low)
        res = process_interest_choice(choice, chat_state["last_options"])

        # map LP
        try:
            m = re.search(r"\*\*(.+?)\*\*", res).group(1)
            lp_id = int(dl.df_lp[dl.df_lp["learning_path_name"] == m]["learning_path_id"].iloc[0])
            chat_state["selected_lp_id"] = lp_id
            chat_state["selected_lp_name"] = m
        except Exception:
            pass

        chat_state["stage"] = "interest_confirm"
        return res + "\n\nLanjut ke **Skill Assessment**? (YA)"

    # interest_confirm
    if chat_state["stage"] == "interest_confirm":
        if low in ["ya","iya","y","yes","ok","oke"]:
            chat_state["stage"] = "choose_n"
            return "Berapa jumlah soal? (5 / 10 / 15)"
        else:
            chat_state["stage"] = "idle"
            return "Baik 😊 Kamu bisa tanya roadmap atau detail course."

    # choose_n
    if chat_state["stage"] == "choose_n" and low.isdigit():
        n = int(low)
        prompt = start_tech_assessment(chat_state["selected_lp_id"], n)
        chat_state["stage"] = "awaiting_answer"
        return prompt

    # awaiting_answer
    if chat_state["stage"] == "awaiting_answer" and re.fullmatch(r"[a-dA-D]", u):
        reply = answer_tech_question(u)
        if "Assessment selesai" in reply:
            chat_state["stage"] = "finished"
        return reply

    # hasil
    if low in ["lihat hasil", "hasil", "hasilnya"]:
        res = get_tech_assessment_result()
        if "error" in res:
            return res["error"]

        chat_state["last_level"] = res["level_name"]
        subs = get_subskill_leveling()
        if subs:
            chat_state["weakest_skill"] = min(subs, key=lambda k: subs[k]["score_pct"])

        return (
            f"🎯 Hasil Assessment\n"
            f"- Benar: {res['correct']} / {res['total']} ({res['score_pct']:.1f}%)\n"
            f"- Level: {res['level_name']}\n\n"
            + pretty_subskill_report()
            + "\n\n"
            + generate_step3_recommendation(chat_state["selected_lp_id"])
            + "\n\n"
            + generate_adaptive_learning_plan(chat_state["selected_lp_id"], user_id)
        )

    # roadmap
    if "roadmap" in low:
        return get_roadmap_lp(chat_state.get("selected_lp_name") or "AI Engineer")

    # detail
    if "detail" in low or "materi" in low:
        try:
            q_emb = dl.model.encode([u.lower()])[0]
            idx = np.argmax(cosine_similarity([q_emb], dl.course_emb)[0])
            course = dl.course_texts[idx]
            return get_detail_course(course)
        except Exception:
            return "Maaf, tidak dapat mencari detail saat ini."

    # fallback LLM
    return ask_llm_safe(u, chat_state)


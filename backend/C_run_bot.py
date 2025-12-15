from B_learning_buddy_core import (
    chat_state, tech_assessment_state,
    run_interest_assessment, process_interest_choice,
    start_tech_assessment, answer_tech_question,
    get_tech_assessment_result, pretty_subskill_report,
    generate_step3_recommendation, generate_adaptive_learning_plan,
    get_roadmap_lp, get_detail_course, get_courses_by_level,
    ask_llm_safe, get_progress_improvement
)
import B_learning_buddy_core as core

def run_console_sim():
    print("Mulai simulasi Learning Buddy. Ketik 'exit' untuk berhenti.")
    while True:
        u = input("You: ").strip()
        if u.lower() == "exit":
            print("Sesi selesai.")
            break

        # Simple routing similar to user's learning_buddy_handle but using functions in core
        low = u.lower()

        # RESET
        if low in ["reset", "ulang", "hapus"]:
            core.chat_state.update({
                "stage":"idle",
                "last_level":None,
                "weakest_skill":None,
                "selected_lp_id":None,
                "selected_lp_name":None
            })
            print("\nBot: Sesi direset 😊 Mau mulai assessment lagi?\n")
            continue

        # start
        if core.chat_state["stage"] == "idle" and any(g in low for g in ["hai","halo","hi","hello"]):
            core.chat_state["stage"] = "awaiting_start"
            print("\nBot: Halo! Aku **Learning Buddy** 😊")
            print("Siap bantu tentukan jalur belajar terbaik.\n")
            print("**Mulai assessment minat belajar?** ketik (Ya) buat lanjut\n")
            continue

        # awaiting_start
        if core.chat_state["stage"] == "awaiting_start" and low in ["ya","iya","y","yes","ok","oke"]:
            q, opt = run_interest_assessment()
            core.chat_state["stage"] = "interest"
            core.chat_state["last_options"] = opt
            print("\nBot:", q, "\n")
            continue

        # interest -> pick option (number)
        if core.chat_state["stage"] == "interest" and low.isdigit():
            choice = int(low)
            res = process_interest_choice(choice, core.chat_state["last_options"])
            # extract lp name if present, try to map to df_lp
            m = None
            try:
                import A_data_loader as dl
                m = re.search(r"\*\*(.+?)\*\*", res).group(1)
                lp_id = int(dl.df_lp[dl.df_lp["learning_path_name"] == m]["learning_path_id"].iloc[0])
                core.chat_state["selected_lp_id"] = lp_id
                core.chat_state["selected_lp_name"] = m
            except Exception:
                pass
            core.chat_state["stage"] = "interest_confirm"
            print("\nBot:", res)
            print("\nBot: Lanjut ke **Skill Assessment**? Ketik (YA) untuk lanjut\n")
            continue

        # interest_confirm
        if core.chat_state["stage"] == "interest_confirm":
            if low in ["ya","iya","y","yes","ok","oke"]:
                core.chat_state["stage"] = "choose_n"
                print("\nBot: Berapa jumlah soal? (5/10/15)\n")
                continue
            else:
                core.chat_state["stage"] = "idle"
                print("\nBot: Baik 😊 Kamu bisa tanya roadmap atau materi apa saja.\n")
                continue

        # choose_n -> start assessment
        if core.chat_state["stage"] == "choose_n" and low.isdigit():
            n = int(low)
            core.chat_state["assessment_n"] = n
            prompt = start_tech_assessment(core.chat_state["selected_lp_id"], n)
            core.chat_state["stage"] = "awaiting_answer"
            print("\nBot:", prompt, "\n")
            continue

        # awaiting_answer -> A/B/C/D answers
        if core.chat_state["stage"] == "awaiting_answer" and re.fullmatch(r"[a-dA-D]", u.strip()):
            reply = answer_tech_question(u.strip())
            print("\nBot:", reply, "\n")
            if "Assessment selesai" in reply:
                core.chat_state["stage"] = "finished"
            continue

        # view result
        if low in ["lihat hasil", "hasil", "hasilnya"]:
            res = get_tech_assessment_result()
            if "error" in res:
                print("\nBot:", res["error"], "\n")
                continue
            print("\nBot: 🎯 **Hasil Assessment Kamu!**\n")
            print(f"- Benar: {res['correct']} / {res['total']} ({res['score_pct']:.1f}%)")
            print(f"- Level: {res['level_name']}\n")
            print(pretty_subskill_report())
            print(generate_step3_recommendation(core.chat_state["selected_lp_id"]))
            print(generate_adaptive_learning_plan(core.chat_state["selected_lp_id"]))
            core.chat_state["last_level"] = res["level_name"]
            # set weakest
            subs = core.get_subskill_leveling()
            if subs:
                core.chat_state["weakest_skill"] = min(subs, key=lambda k: subs[k]["score_pct"])
            core.chat_state["stage"] = "idle"
            continue

        # simple free mode commands: roadmap / detail / what is X / retry test
        if "roadmap" in low:
            print("\nBot:", get_roadmap_lp(core.chat_state.get("selected_lp_name") or "AI Engineer"), "\n")
            continue

        if "detail" in low or "materi" in low:
            # find nearest course by embedding using dl.model and dl.course_emb
            try:
                import A_data_loader as dl
                q_emb = dl.model.encode([u.lower()])[0]
                idx = np.argmax(cosine_similarity([q_emb], dl.course_emb)[0])
                course = dl.course_texts[idx]
                print("\nBot:", get_detail_course(course), "\n")
            except Exception as e:
                print("\nBot: Maaf, tidak dapat mencari detail saat ini.\n")
            continue

        if any(x in low for x in ["ulang test", "retest", "mulai ulang", "ulang assessment"]):
            # reset tech assessment only and ask how many questions
            tech_assessment_state["current_index"] = 0
            tech_assessment_state["finished"] = False
            tech_assessment_state["user_answers"] = []
            tech_assessment_state["selected_questions"] = None
            core.chat_state["stage"] = "choose_n"
            print("\nBot: Baik! Yuk mulai ulang assessment kamu 🔄\nBerapa jumlah soal yang ingin kamu kerjakan? (5/10/15)\n")
            continue

        # definition fallback (ask llm)
        if any(x in low for x in ["apa itu", "jelaskan", "define", "what is"]):
            resp = ask_llm_safe(u, core.chat_state)
            print("\nBot:", resp, "\n")
            continue

        # default fallback
        resp = ask_llm_safe(u, core.chat_state)
        print("\nBot:", resp, "\n")


if __name__ == "__main__":
    run_console_sim()
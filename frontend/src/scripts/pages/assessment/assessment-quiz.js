import AssessmentLayout from "./assessment-layout.js";
import { getQuestionsByLearningPath } from "../../api/assessmentAPI.js";
import { getQueryParams } from "../../app/routerHelper.js";
import { shuffleArray } from "./quiz-utils.js";
import "../../../styles/assessment-quiz.css";

class AssessmentQuiz {
  constructor() {
    this.questions = [];
    this.currentIndex = 0;
    this.answers = {};
    this.timeLeft = 30 * 60; // 30 menit
    this.timerInterval = null;
  }

  async render() {
    const layout = new AssessmentLayout();

    return layout.render(`
      <section class="quiz-page">
        <div class="panel quiz-panel">
          <div class="quiz-header">
            <h3>Assessment Quiz</h3>
            <div id="quiz-timer">⏱ 30:00</div>
          </div>

          <div id="quiz-container">
            <p>Memuat soal...</p>
          </div>
        </div>
      </section>
    `);
  }

  async afterRender() {
    const params = getQueryParams();
    const lpId = params.lp;
    localStorage.setItem("assessment_learning_path", lpId);

    const container = document.querySelector("#quiz-container");

    if (!lpId) {
      container.innerHTML = "<p>Learning Path tidak ditemukan.</p>";
      return;
    }

    const all = await getQuestionsByLearningPath(lpId);

    if (!all || all.length === 0) {
      container.innerHTML =
        "<p>Tidak ada soal untuk learning path ini.</p>";
      return;
    }

    this.questions = shuffleArray(all);
    this.currentIndex = 0;
    this.answers = {};

    this.startTimer();
    this.renderQuestion();
  }

  // ===============================
  // ⏱ TIMER
  // ===============================
  startTimer() {
    const timerEl = document.getElementById("quiz-timer");

    this.timerInterval = setInterval(() => {
      this.timeLeft--;

      const min = Math.floor(this.timeLeft / 60);
      const sec = this.timeLeft % 60;

      timerEl.innerText =
        "⏱ " +
        String(min).padStart(2, "0") +
        ":" +
        String(sec).padStart(2, "0");

      if (this.timeLeft <= 0) {
        clearInterval(this.timerInterval);
        alert("Waktu habis! Quiz akan disubmit.");
        this.submitQuiz(true);
      }
    }, 1000);
  }

  // ===============================
  // SUBMIT QUIZ
  // ===============================
  submitQuiz(force = false) {
    if (!force) {
      const confirmSubmit = confirm(
        "Apakah kamu yakin ingin mengakhiri assessment?"
      );
      if (!confirmSubmit) return;
    }

    clearInterval(this.timerInterval);

    localStorage.setItem(
      "assessment_questions",
      JSON.stringify(this.questions)
    );
    localStorage.setItem(
      "assessment_answers",
      JSON.stringify(this.answers)
    );

    window.location.hash = "#/assessment/result";
  }

  // ===============================
  // RENDER SOAL
  // ===============================
  renderQuestion() {
    const container = document.querySelector("#quiz-container");
    if (!container) return;

    // ===== QUIZ SELESAI =====
    if (this.currentIndex >= this.questions.length) {
      container.innerHTML = `
        <div class="quiz-finish">
          <p>Quiz selesai.</p>
          <button id="finish-btn" class="button-primary">
            Submit Jawaban
          </button>
        </div>
      `;

      document.getElementById("finish-btn").onclick = () => {
        this.submitQuiz();
      };

      return;
    }

    const q = this.questions[this.currentIndex];
    const idx = this.currentIndex + 1;
    const total = this.questions.length;

    const options = [
      { key: "A", text: q.option_1 },
      { key: "B", text: q.option_2 },
      { key: "C", text: q.option_3 },
      { key: "D", text: q.option_4 },
    ];

    const selected = this.answers[q.question_id] || "";

    container.innerHTML = `
      <div class="question-card">
        <div class="question-meta">
          <strong>Soal ${idx}/${total}</strong>
          <small> — ${q.tech_category} • ${q.difficulty}</small>
        </div>

        <div class="q-desc">
          ${q.question_desc}
        </div>

        <div class="options">
          ${options
            .map(
              (opt) => `
            <label class="option-item">
              <input
                type="radio"
                name="opt"
                value="${opt.key}"
                ${selected === opt.key ? "checked" : ""}
              />
              <span>${opt.key}. ${opt.text}</span>
            </label>
          `
            )
            .join("")}
        </div>

        <div class="quiz-actions">
          <button id="prev-btn" ${
            this.currentIndex === 0 ? "disabled" : ""
          }>
            Prev
          </button>
          <button id="next-btn">
            ${idx === total ? "Finish" : "Next"}
          </button>
        </div>

        <div class="quiz-progress">
          <small>Progress: ${idx}/${total}</small>
        </div>
      </div>
    `;

    // 🔑 SIMPAN JAWABAN SAAT RADIO DIPILIH
    container.querySelectorAll('input[name="opt"]').forEach((r) => {
      r.addEventListener("change", (e) => {
        this.answers[q.question_id] = e.target.value;
      });
    });

    // PREV
    document.getElementById("prev-btn").onclick = () => {
      if (this.currentIndex > 0) {
        this.currentIndex--;
        this.renderQuestion();
      }
    };

    // NEXT / FINISH (🔥 FIX UTAMA DI SINI)
    document.getElementById("next-btn").onclick = () => {
      const checked = container.querySelector(
        'input[name="opt"]:checked'
      );

      // paksa simpan jawaban
      if (checked) {
        this.answers[q.question_id] = checked.value;
      }

      if (!this.answers[q.question_id]) {
        const proceed = confirm(
          "Anda belum memilih jawaban. Lanjut tanpa memilih?"
        );
        if (!proceed) return;
      }

      this.currentIndex++;
      this.renderQuestion();
    };
  }
}

export default AssessmentQuiz;
